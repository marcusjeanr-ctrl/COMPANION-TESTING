#!/usr/bin/env python3
"""Real Chromium, mocked Lumiverse bridge. Not a live host certification.
Requires playwright==1.62.0 and its Chromium, or CHROMIUM_PATH.
Run: python3 tools/test_ui_browser.py [--frontend /path/to/frontend.js]
"""
import argparse
import json
import os
import pathlib
import subprocess
import unittest
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--frontend', default=str(ROOT / 'dist/frontend.js'))
parser.add_argument('--measure', help='Write local render timings instead of running assertions')
args, remaining = parser.parse_known_args()
SOURCE = pathlib.Path(args.frontend).read_text().replace('export function setup', 'window.setup = function')
FIXTURE = json.loads(subprocess.check_output(['node',str(ROOT/'tools/ui_browser_fixture.cjs')],text=True))

class BrowserUi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        options = {'headless':True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        cls.browser = cls.playwright.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page(viewport={'width':320,'height':800})
        self.errors = []
        self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.page.set_content('<style>body{margin:0;background:#15151b}#drawer{height:100vh;overflow:auto}</style><div id="drawer"></div>')
        self.page.add_script_tag(content=SOURCE)
        self.page.evaluate('''() => {
            window.sent=[]; window.hostEvents={}; window.activeChat={chatId:'test',characterId:'character'};
            window.dispose=window.setup({composer:{getState(){return {mounted:window.composerMounted!==false,chatId:activeChat.chatId,text:window.draft||''}},setText(text){window.draft=text},focus(){window.composerFocused=true},send(){throw new Error('Must never send a draft')}},dom:{addStyle(css){const s=document.createElement('style');s.textContent=css;document.head.append(s);return ()=>s.remove();}},
            ui:{registerDrawerTab(){return {root:document.querySelector('#drawer'),activate(){},destroy(){}};},
                registerInputBarAction(){return {onClick(){},setEnabled(){},destroy(){}};}},
            sendToBackend(x){sent.push(x)},onBackendMessage(fn){window.receive=fn;return ()=>{};},
            getActiveChat(){return activeChat;},events:{on(ev,fn){hostEvents[ev]=fn;return ()=>{};}}});
        }''')
        self.receive(FIXTURE['payload'])

    def tearDown(self):
        self.page.evaluate('window.dispose()')
        self.page.close()
        self.assertEqual(self.errors,[])

    def receive(self,payload):
        self.page.evaluate('(p)=>window.receive(p)',payload)
        self.page.evaluate("document.querySelectorAll('details').forEach(x=>x.open=true)")

    def assert_float_inside_viewport(self):
        bounds = self.page.locator('.rpgc-float').bounding_box()
        viewport = self.page.viewport_size
        self.assertGreaterEqual(bounds['x'],0)
        self.assertGreaterEqual(bounds['y'],0)
        self.assertLessEqual(bounds['x']+bounds['width'],viewport['width']+1)
        self.assertLessEqual(bounds['y']+bounds['height'],viewport['height']+1)

    def test_repetition_is_lazy_read_only_and_default_hint_off(self):
        pane=self.page.locator('[data-open-key=play-repetition]')
        self.page.wait_for_function("sent.some(x=>x.type==='play_prose')")
        self.page.evaluate("p=>receive(p)",{'type':'play_prose','chatId':'test','requestKey':self.page.evaluate("sent.findLast(x=>x.type==='play_prose'&&x.view==='repetition').requestKey"),'replyId':FIXTURE['payload']['hms']['messageId'],'rows':[],'repetition':[{'text':'sharp','count':8,'total':10}]})
        self.assertIn('sharp · 8/10',pane.inner_text())
        pane.locator('summary').click();self.assertFalse(pane.locator('li').first.is_visible())


    def test_next_actions_only_edit_the_composer_draft(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['data']['characters']=[{'name':'Clerk'}]
        self.receive(payload)
        pane=self.page.locator('[data-open-key=play-next-actions]')
        button=pane.get_by_role('button',name='I speak to Clerk.',exact=True)
        self.page.evaluate('sent=[]');button.click()
        self.assertEqual(self.page.evaluate('window.draft'),'I speak to Clerk.')
        self.assertTrue(self.page.evaluate('window.composerFocused'))
        self.assertEqual(self.page.evaluate('sent'),[])
        self.page.evaluate("window.draft+=' I pause.'")
        self.assertIn('I pause.',self.page.evaluate('window.draft'))
        self.assertTrue(pane.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))


    def test_voice_suggestion_needs_explicit_acceptance(self):
        self.page.locator('button.rpgc-npc-name').first.click()
        name=self.page.locator('.rpgc-play-modal h3').inner_text()
        req=self.page.evaluate("sent.findLast(x=>x.type==='play_prose')")
        self.page.evaluate('p=>receive(p)',{'type':'play_prose','chatId':'test','replyId':req['replyId'],'requestKey':req['requestKey'],'view':'voice','rows':[{'text':f'[D:{name}]"Wait."\n[D:{name}]"Good morning."'}],'repetition':[]})
        self.page.evaluate('p=>receive(p)',{'type':'play_note','chatId':'test','kind':'voice','name':name,'text':''})
        pane=self.page.locator('.rpgc-voice-note')
        self.assertIn('Suggestion — not accepted',pane.inner_text())
        self.assertFalse(self.page.evaluate("sent.some(x=>x.type==='play_note_save')"))
        pane.get_by_role('textbox').fill('My accepted note')
        pane.get_by_role('button',name='Accept or save edit').click()
        self.assertEqual(self.page.evaluate("sent.findLast(x=>x.type==='play_note_save').text"),'My accepted note')
        self.page.evaluate('p=>receive(p)',{'type':'play_note','chatId':'test','kind':'voice','name':name,'error':'Note limit reached'})
        self.assertEqual(self.page.locator('.rpgc-voice-note input').input_value(),'My accepted note')


    def test_journal_load_does_not_ask_or_save(self):
        payload,chron=self.recent_timeline_fixture()
        chron['chronicle']['entries'].append({'id':'journal','kind':'milestone','text':'A recorded milestone','when':'K417 Month 4 Day 1, 09:00'})
        self.receive(payload);self.receive(chron)
        pane=self.page.locator('[data-open-key=play-journal]')
        req=self.page.evaluate("sent.findLast(x=>x.type==='play_note_view'&&x.kind==='journal')")
        self.assertIsNotNone(req)
        self.page.evaluate('p=>receive(p)',{'type':'play_note','chatId':'test','kind':'journal','name':req['name'],'text':''})
        self.assertIn('A recorded milestone',pane.get_by_role('textbox',name='Journal entry').input_value())
        self.assertFalse(self.page.evaluate("sent.some(x=>x.type==='play_journal_ask'||x.type==='play_note_save')"))
        pane.get_by_role('textbox',name='Journal entry').fill('An edited journal')
        pane.get_by_role('button',name='Save journal',exact=True).click()
        self.assertEqual(self.page.evaluate("sent.findLast(x=>x.type==='play_note_save').text"),'An edited journal')
        pane.get_by_role('button',name='Ask the story to write this day in my voice',exact=True).click()
        self.assertEqual(self.page.evaluate("sent.filter(x=>x.type==='play_journal_ask').length"),1)
        pane.get_by_role('textbox',name='Journal entry').fill('An edit while the draft is pending')
        self.page.evaluate('p=>receive(p)',{'type':'play_journal_draft','chatId':'test','day':req['name'],'text':'A generated candidate'})
        self.assertEqual(pane.get_by_role('textbox',name='Journal entry').input_value(),'An edit while the draft is pending')
        pane.get_by_role('button',name='Use generated draft',exact=True).click()
        self.assertEqual(pane.get_by_role('textbox',name='Journal entry').input_value(),'A generated candidate')


    def test_reputation_preserves_hud_terms_and_empty_state(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['hud']['lines'].append({'key':'renown','text':'Renown: Fittoa: Local name | elsewhere: Unknown'})
        self.receive(payload)
        pane=self.page.locator('[data-open-key=play-reputation]')
        self.assertIn('Fittoa: Local name',pane.inner_text())
        self.assertIn('elsewhere: Unknown',pane.inner_text())
        self.assertTrue(pane.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))

    def test_calendar_birth_month_has_no_invented_day(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['userName']='Marcus'
        payload['hms']['hud']['lines'][0]['text']='Armored Dragon Calendar: K417, Month 4, Day 1 | Time: 09:20'
        payload['hms']['hud']['lines'].append({'key':'race','text':'Age: 13 (born K404, Month 2)'})
        self.receive(payload)
        pane=self.page.locator('[data-open-key=play-calendar]')
        self.assertEqual(pane.locator('.rpgc-calendar-day').count(),30)
        for _ in range(10):pane.get_by_role('button',name='Next month',exact=True).click()
        self.assertIn('Turns 14 in K418, Month 2',pane.inner_text())
        self.assertIn('Exact birthday not reported',pane.inner_text())
        self.assertTrue(pane.locator('.rpgc-calendar-grid').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
        payload['hms']['hud']['lines']=[{'key':'date','text':'Date: 2026-10-30'}]
        self.receive(payload)
        self.assertEqual(self.page.locator('[data-open-key=play-calendar]').count(),0)

    def test_standing_history_is_in_lazy_npc_dossier(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        person=payload['hms']['relations']['people'][0]
        person.update(standing='Close',events=['Wary → Friendly','Friendly → Close'])
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-standing-history').count(),0)
        self.page.locator('button.rpgc-npc-name').first.click()
        graph=self.page.locator('.rpgc-standing-history svg')
        self.assertEqual(graph.count(),1)
        self.assertTrue(graph.evaluate('(e)=>e.getBoundingClientRect().width<=innerWidth'))
        self.assertIn('Wary → Friendly → Close',self.page.locator('.rpgc-standing-history').inner_text())

    def test_open_loops_excludes_paid_off_and_resolved_sources(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['minds']['chekhov']={'chamber':[{'id':'live','what':'Aurelius promises a meeting','w':2,'age':1,'readAt':540,'status':'live'}],
            'locked':[],'fired':[{'id':'paid','what':'Paid-off promise must stay out','w':2,'age':2,'ago':0,'status':'fired'}],'byYou':[]}
        self.receive(payload)
        pane=self.page.locator('[data-open-key=play-open-loops]')
        self.assertIn('Aurelius promises a meeting',pane.inner_text())
        self.assertNotIn('Paid-off promise must stay out',pane.inner_text())
        pane.locator('summary').click()
        self.page.evaluate('(p)=>window.receive(p)',payload)
        self.assertEqual(pane.locator('.rpgc-open-loops').count(),0)

    def test_change_strip_is_lazy_and_uses_two_replies(self):
        pane=self.page.locator('[data-open-key=play-changes]')
        pane.evaluate("e=>{e.open=false;e.dispatchEvent(new Event('toggle'))}")
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['messageId']='next-reply'
        payload['hms']['hud']['location']=['New town']
        self.page.evaluate('(p)=>window.receive(p)',payload)
        self.assertEqual(self.page.locator('.rpgc-change-line').count(),0)
        pane.locator('summary').click()
        self.assertIn('Location:',self.page.locator('.rpgc-change-line').inner_text())
        self.assertIn('New town',self.page.locator('.rpgc-change-line').inner_text())

    def test_ability_evidence_retained_and_historical_are_distinct(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        obs=[{'msgId':str(i),'state':'Reliable','evidence':'You execute the cut.','at':i,'historical':False} for i in range(3)]
        item={'name':'Compact diagonal cut','state':'Reliable','observations':obs}
        payload['hms']['systems']['abilities']=[{'category':'Martial','items':[item]}]
        self.receive(payload)
        pane=self.page.locator('[data-open-key=abilities]')
        self.assertIn('Retained observations: 3',pane.inner_text())
        for row in obs: row['historical']=True
        self.receive(payload)
        self.assertIn('Historical evidence: 3',pane.inner_text())
        item['observations']=[];self.receive(payload)
        self.assertIn('No retained evidence',pane.inner_text())
        payload['settings']['playTools']={'abilityEvidence':False}
        self.receive(payload)
        self.assertEqual(pane.locator('.rpgc-ability-evidence').count(),0)

    def test_quest_chain_labels_keep_separate_cards_and_opt_out(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        base=payload['hms']['systems']['quests'][0]
        payload['hms']['systems']['quests']=[dict(base,key='q_old',name='Find the teacher',state='completed',cls='done',giver='Guild',reward='Audience with the prince'),
            dict(base,key='q_new',name='The audience',state='active',cls='active',giver='Guild',reward='Audience with the prince')]
        self.receive(payload)
        text=' '.join(self.page.locator('.rpgc-quest-chain').all_text_contents())
        self.assertIn('Continues from Find the teacher',text)
        self.assertIn('Continued in The audience',text)
        payload['settings']['playTools']={'questChains':False}
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-quest-chain').count(),0)
        self.assertEqual(self.page.evaluate("sent.filter(x=>/quest_end|quest_restore/.test(x.type))"),[])

    def test_countdown_pinned_agenda_missing_and_overdue(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['settings']['compactMobile']=True
        item=payload['hms']['agenda']['items'][0]
        item.update(what='Study with Aurelius',state='open',status='soon',dueIn=40,when='at the bell')
        payload['hms']['agenda']['items']=[item]
        self.receive(payload)
        self.assertIn('Study with Aurelius — in 40m',self.page.locator('.rpgc-pinned-appointment').inner_text())
        self.assertEqual(self.page.locator('.rpgc-agenda-item .due').inner_text(),'in 40m')
        item['dueIn']=-10;self.receive(payload)
        self.assertIn('overdue',self.page.locator('.rpgc-agenda-item .due').inner_text())
        item['dueIn']=None;self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-pinned-appointment').count(),0)
        self.assertEqual(self.page.locator('.rpgc-agenda-item .due').inner_text(),'at the bell')

    def test_quieter_chronicle_all_highlights_and_lazy_daily_bonds(self):
        payload,chron=self.recent_timeline_fixture()
        chron['chronicle']['entries'] += [{'id':'b'+str(i),'kind':'bond','text':text,'who':['Clerk'],
            'replyIndex':8+i*2,'when':'K417 Month 4 Day 1, 10:0'+str(i),'settled':True,'imp':3} for i,text in enumerate(['Wary to friendly','Friendly to close'])]
        self.receive(payload);self.receive(chron)
        section=self.page.locator('[data-open-key=chronicle]')
        filters=section.locator('.rpgc-filters')
        self.assertEqual(section.locator('.rpgc-chron-item.bond').count(),2)
        filters.get_by_role('button',name='Highlights',exact=True).click()
        self.assertEqual(section.locator('.rpgc-chron-item.bond').count(),0)
        self.assertEqual(section.locator('.rpgc-chron-item.moment').count(),1)
        filters.get_by_role('button',name='💞 Bonds',exact=True).click()
        self.assertEqual(section.locator('.rpgc-daily-bond').count(),1)
        self.assertEqual(section.locator('.rpgc-chron-item.bond').count(),0)
        section.locator('.rpgc-daily-bond > summary').click()
        section.locator('.rpgc-chron-item.bond').first.wait_for(state='visible')
        self.assertEqual(section.locator('.rpgc-chron-item.bond').count(),2)
        filters.get_by_role('button',name='All',exact=True).click()
        self.assertEqual(section.locator('.rpgc-daily-bond').count(),0)
        self.assertEqual(section.locator('.rpgc-chron-item.bond').count(),2)

    def test_recap_resumed_dismissal_and_session_generation(self):
        self.assertEqual(self.page.locator('.rpgc-recap').count(),1)
        self.page.get_by_role('button',name='Dismiss recap',exact=True).click()
        self.assertEqual(self.page.locator('.rpgc-recap').count(),0)
        self.receive(FIXTURE['payload'])
        self.assertEqual(self.page.locator('.rpgc-recap').count(),0)
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['messageId']='generated-here'
        self.page.evaluate("hostEvents.GENERATION_ENDED({chatId:activeChat.chatId,messageId:'generated-here'})")
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-recap').count(),0)

    def test_npc_dossier_is_lazy_read_only_and_mobile(self):
        self.assertEqual(self.page.locator('[role=dialog][aria-label="NPC dossier"]').count(),0)
        button=self.page.locator('button.rpgc-npc-name').first
        button.click()
        modal=self.page.locator('[role=dialog][aria-label="NPC dossier"]')
        self.assertEqual(modal.count(),1)
        self.assertIn('Aurelius',modal.inner_text())
        self.assertTrue(modal.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
        modal.get_by_role('button',name='Close',exact=True).click()
        self.assertEqual(modal.count(),0)
        self.assertEqual(self.page.evaluate("sent.filter(x=>/edit|rel_pin|family$|sim_edit/.test(x.type))"),[])
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['settings'].update(uiTheme='mushoku',uiPanelMode='float')
        self.receive(payload)
        self.page.locator('button.rpgc-npc-name').first.click()
        modal=self.page.locator('[role=dialog][aria-label="NPC dossier"]')
        self.assertTrue(modal.evaluate('(e)=>e.getBoundingClientRect().width<=innerWidth'))
        self.assertEqual(modal.evaluate('(e)=>getComputedStyle(e).backgroundColor'),'rgb(253, 247, 234)')
        modal.get_by_role('button',name='Close',exact=True).click()
        payload['settings']['playTools']={'npcDossier':False}
        self.receive(payload)
        self.assertEqual(self.page.locator('button.rpgc-npc-name').count(),0)

    def recent_timeline_fixture(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['userName']='Marcus'
        payload['chronicle']={'version':'recent-fixture'}
        texts=["Aurelius's price: a meeting with the Greyrat boy in exchange for proving himself", "Aurelius's promise to arrange a meeting with the Greyrat boy", "Aurelius's promise to introduce Marcus to the Greyrat boy"]
        payload['hms']['minds']['chekhov']={'chamber':[],'locked':[],'fired':[
            {'id':'c'+str(i),'what':t,'status':'fired','age':3-i,'ago':2-i,'w':2,'readAt':540+i*10} for i,t in enumerate(texts)],'byYou':[]}
        entries=[{'id':'e'+str(i),'msgId':'a'+str(i),'replyIndex':i*2,'kind':'moment','text':t,
            'who':['Marcus','Cassian'],'when':'K417 Month 4 Day 1, 09:0'+str(i),'loop':1,'settled':True,'imp':7} for i,t in enumerate([
            'Marcus decisively defeated Cassian in a duel, fundamentally altering their sibling dynamic',
            'Marcus decisively defeated Cassian in a duel, fundamentally shifting their sibling dynamic'])]
        chron={'type':'chronicle','chatId':payload['chatId'],'chronicle':{'version':'recent-fixture','entries':entries,'cortex':{'mode':'off'}}}
        return payload,chron

    def test_recent_timeline_display_groups_and_opt_out_at_320px(self):
        payload,chron=self.recent_timeline_fixture()
        for theme in ['space','mushoku']:
            payload['settings']['uiTheme']=theme
            payload['settings']['chronicle']['collapseSimilar']=True
            self.receive(payload);self.receive(chron)
            self.assertEqual(self.page.locator('.rpgc-chron-item.moment').count(),1)
            self.assertEqual(self.page.locator('.rpgc-chron-item.moment .rpgc-repeat-count').inner_text(),'×2')
            self.assertIn('altering',self.page.locator('.rpgc-chron-item.moment').inner_text())
            self.assertEqual(self.page.locator('.rpgc-chekhov-fired li').count(),1)
            self.assertEqual(self.page.locator('.rpgc-chekhov-fired .rpgc-repeat-count').inner_text(),'×3')
            for row in self.page.locator('.rpgc-chron-item,.rpgc-chekhov-fired li').all():
                self.assertTrue(row.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
            payload['settings']['chronicle']['collapseSimilar']=False
            self.receive(payload);self.receive(chron)
            self.assertEqual(self.page.locator('.rpgc-chron-item.moment').count(),2)
            self.assertEqual(self.page.locator('.rpgc-chekhov-fired li').count(),3)
        self.assertEqual(self.page.evaluate("sent.filter(x=>/edit|sim_edit/.test(x.type))"),[])

    def test_recent_timeline_is_lazy_when_chronicle_and_quests_are_closed(self):
        payload,chron=self.recent_timeline_fixture()
        self.receive(payload);self.receive(chron)
        self.page.evaluate("document.querySelectorAll('details').forEach(e=>{e.open=false;e.dispatchEvent(new Event('toggle'))})")
        self.page.wait_for_function("!document.querySelector('[data-open-key=chronicle]').open")
        self.page.evaluate("window.dedupCalls=0;const original=recentTimelineRows;recentTimelineRows=(...args)=>{dedupCalls++;return original(...args)};undefined")
        self.page.evaluate('(p)=>window.receive(p)',chron)
        self.assertEqual(self.page.evaluate('dedupCalls'),0)
        self.assertEqual(self.page.locator('.rpgc-chron-item').count(),0)
        self.assertEqual(self.page.locator('.rpgc-chekhov-fired').count(),0)
        self.page.locator('[data-open-key=chronicle] > summary').click()
        self.page.wait_for_function('window.dedupCalls>0')
        self.assertEqual(self.page.locator('.rpgc-chron-item.moment').count(),1)

    def test_objective_quest_references_display_titles_without_sending(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['systems']['quests']=[{'key':'assignment','questId':'q_greyrat_meet','name':'Meet the young adventurer'}]
        payload['plotView']={'on':{'plot':False,'objectives':True},'objectives':[
            {'text':'Speak to the sponsor','state':'active','quest':'q_greyrat_meet'},
            {'text':'Prepare','state':'active','quest':'Meet the young adventurer'},
            {'text':'Unknown reference','state':'active','quest':'q_unknown'}],'mine':[]}
        self.receive(payload)
        chips=self.page.locator('.rpgc-objectives .rpgc-checklist .rpgc-chip').all_text_contents()
        self.assertEqual(chips,['Meet the young adventurer','Meet the young adventurer','q_unknown'])
        self.assertEqual(self.page.evaluate("sent.filter(x=>/edit|objective_mine/.test(x.type))"),[])

    def test_long_spell_names_and_full_study_note(self):
        row = self.page.locator('.rpgc-spell-study .rpgc-spell-row').first
        self.assertEqual(row.locator('p').first.text_content(),FIXTURE['note'])
        self.assertEqual(row.locator('.head b').text_content(),FIXTURE['name'])
        widths = row.evaluate('(e)=>({scroll:e.scrollWidth,client:e.clientWidth})')
        self.assertLessEqual(widths['scroll'],widths['client']+1,'Spell text overflows the card')

    def test_six_sided_visual_world_projection(self):
        # Synthetic current observations, including a long-lived non-human and an
        # explicitly ambiguous combined tag. The World panel must not relabel it.
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['world'].update(age=1200, eyes=[{'text':'Foresight (Sealed)','lore':None}],
            marks=[{'kind':'CURSE / BLESSING','name':'Ageless — 長命の旅人','lore':None}])
        self.receive(payload)
        text=self.page.locator('.rpgc').inner_text()
        self.assertIn('1200',text)
        self.assertIn('Foresight (Sealed)',text)
        self.assertIn('Curse / Blessing',text)
        self.assertIn('Ageless — 長命の旅人',text)

    def test_historical_ability_assessment_is_visible_and_escaped(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        spell=payload['hms']['magic']['list']['schools'][0]['spells'][0]
        quote='A signed record confirms prior knowledge. <img src=x onerror="window.bad=true">'
        spell['status']='known'
        spell['evidence']={'historical':True,'state':'reliable','evidence':quote}
        self.receive(payload)
        text=self.page.locator('.rpgc').inner_text()
        self.assertIn('Historical assessment · reliable: '+quote,text)
        self.assertFalse(self.page.evaluate('!!window.bad'))

    def test_mobile_float_and_enlarge(self):
        self.page.get_by_label('Where the panel lives').select_option('float')
        self.assert_float_inside_viewport()
        self.page.get_by_label('Enlarge',exact=True).click()
        self.assert_float_inside_viewport()
        self.page.get_by_label('Where the panel lives').select_option('drawer')
        self.assertEqual(self.page.locator('#drawer > .rpgc').count(),1)

    def test_saved_float_and_viewport_resize(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['settings']['uiPanelMode']='float'
        payload['settings']['uiFloat']={'x':1200,'y':900,'w':700,'h':900}
        self.page.set_viewport_size({'width':1440,'height':1000})
        self.receive(payload)
        self.assert_float_inside_viewport()
        self.page.set_viewport_size({'width':320,'height':568})
        self.page.wait_for_function('''() => {const r=document.querySelector('.rpgc-float').getBoundingClientRect();return r.right<=innerWidth+1 && r.bottom<=innerHeight+1}''',timeout=5000)
        self.assert_float_inside_viewport()
        self.assertEqual(self.page.get_by_label('Back to the drawer',exact=True).count(),1)

    def test_statuses_settings_and_test_zone(self):
        self.page.locator('.rpgc-spell-bar').first.get_by_role('button',name='All',exact=True).click()
        self.page.evaluate("document.querySelectorAll('details').forEach(x=>x.open=true)")
        for label in ['Known','Studying','Mastered','Locked']:
            self.assertTrue(self.page.locator('.rpgc-spell-st').filter(has_text=label).count(),label)
        self.page.get_by_role('button',name='Settings',exact=True).click()
        self.assertTrue(self.page.locator('.rpgc').inner_text())
        self.page.get_by_role('button',name='Back to trackers',exact=True).click()
        self.page.get_by_role('button',name='Test zone',exact=True).click()
        self.assertIn('Leave test zone',self.page.locator('.rpgc').inner_text())
        self.page.get_by_role('button',name='Leave test zone',exact=True).click()

    def test_density_text_size_and_theme_variations(self):
        for width, density, size, theme in [(240,'compact','large','space'),(320,'comfortable','small','host'),(768,'comfortable','normal','parchment')]:
            with self.subTest(width=width,density=density,size=size,theme=theme):
                payload=json.loads(json.dumps(FIXTURE['payload']))
                payload['settings'].update(uiDensity=density,uiTextSize=size,uiTheme=theme)
                self.page.set_viewport_size({'width':width,'height':800})
                self.receive(payload)
                widths=self.page.locator('.rpgc-spell-study .rpgc-spell-row').first.evaluate('(e)=>[e.scrollWidth,e.clientWidth]')
                self.assertLessEqual(widths[0],widths[1]+1)
                self.page.get_by_label('Where the panel lives').select_option('float')
                self.assert_float_inside_viewport()
                self.page.get_by_label('Where the panel lives').select_option('drawer')

    def test_previous_chat_extras_cleared_immediately(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['extras']=payload['hms'];payload['hms']=None;payload['world']=None
        payload['extras']['gear']['items'][0]['name']='Private previous-chat heirloom'
        self.receive(payload)
        self.assertIn('Private previous-chat heirloom',self.page.locator('.rpgc').inner_text())
        self.page.evaluate("activeChat={chatId:'next-chat',characterId:'character'};hostEvents.CHAT_SWITCHED()")
        self.assertNotIn('Private previous-chat heirloom',self.page.locator('.rpgc').inner_text())
        self.receive(payload)
        self.assertNotIn('Private previous-chat heirloom',self.page.locator('.rpgc').inner_text())

    def test_popout_and_return_to_drawer(self):
        with self.page.expect_popup() as popup:
            self.page.get_by_label('Where the panel lives').select_option('popout')
        window=popup.value
        self.assertEqual(window.locator('.rpgc').count(),1)
        self.assertIn('Magic',window.locator('.rpgc').inner_text())
        window.get_by_label('Where the panel lives').select_option('drawer')
        self.assertEqual(self.page.locator('#drawer > .rpgc').count(),1)

    def test_popout_observer_is_disconnected_on_disposal(self):
        self.page.evaluate("""() => {
            const Native=window.MutationObserver; window.liveLookObservers=new Set();
            window.MutationObserver=class extends Native {
                observe(target,options){super.observe(target,options);liveLookObservers.add(this)}
                disconnect(){super.disconnect();liveLookObservers.delete(this)}
            };
        }""")
        with self.page.expect_popup() as popup:
            self.page.get_by_label('Where the panel lives').select_option('popout')
        self.assertEqual(self.page.evaluate('liveLookObservers.size'),1)
        self.page.evaluate('dispose()')
        self.assertEqual(self.page.evaluate('liveLookObservers.size'),0)
        self.assertTrue(popup.value.is_closed())

    def test_catalogue_debounces_are_cancelled_on_disposal(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['newGame']={'pages':1}
        payload['settings']['showNewGame']=True
        self.receive(payload)
        self.page.evaluate("""() => receive({type:'catalog',chatId:'test',catalog:{handler:'Start',pages:[{
            index:0,title:'Starts',items:Array.from({length:13},(_,i)=>({kind:'start',section:'Starts',cmd:'Start '+i}))
        }]}})""")
        self.page.evaluate("document.querySelectorAll('details').forEach(x=>x.open=true)")
        # Record the real browser timer IDs for these two delayed operations.
        self.page.evaluate("""() => {
            const schedule=window.setTimeout, cancel=window.clearTimeout;
            window.catalogueTimers=new Set();
            window.setTimeout=(fn,ms,...args)=>{const id=schedule(fn,ms,...args);
                if(ms===200||ms===250)catalogueTimers.add(id);return id};
            window.clearTimeout=id=>{catalogueTimers.delete(id);cancel(id)};
            const filter=document.querySelector('[aria-label="Find on this page"]');
            filter.value='Start';filter.dispatchEvent(new Event('input'));
            const command=document.querySelector('[aria-label="Your start command"]');
            command.value='Start 1';command.dispatchEvent(new Event('input'));
        }""")
        self.assertEqual(self.page.evaluate('catalogueTimers.size'),2)
        before=self.page.evaluate("sent.filter(x=>x.type==='catalog_check').length")
        self.page.evaluate('dispose()')
        self.assertEqual(self.page.evaluate('catalogueTimers.size'),0)
        self.page.wait_for_timeout(350)
        self.assertEqual(self.page.evaluate("sent.filter(x=>x.type==='catalog_check').length"),before)

    def test_continuation_states_attached_to_the_correct_reply(self):
        self.assertIn('Internal states',FIXTURE['continuationHtml'])
        self.page.evaluate('''(html)=>{
            const old=document.createElement('article');old.id='previous-reply';old.textContent='Earlier reply';
            const resumed=document.createElement('article');resumed.id='continued-ui';resumed.innerHTML=html;
            document.body.append(old,resumed);
        }''',FIXTURE['continuationHtml'])
        self.assertEqual(self.page.locator('#previous-reply .rs').count(),0)
        self.assertEqual(self.page.locator('#continued-ui .rs').count(),1)
        self.assertEqual(self.page.locator('#continued-ui .rs input[type=radio]').count(),self.page.locator('#continued-ui .rs label').count())

    def test_living_world_sandbox_pacts_and_drain_display(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['world'].update(contracts='Lantern | RANK: Spirit; Watcher',drain={'stage':'Year 3 of 10','onset':None},
            saga={'year':417,'from':407,'to':431,'arcs':[],'current':None,'next':None,'personalArc':'Sandbox — Build a workshop','participation':'personal'})
        self.receive(payload)
        text=self.page.locator('.rpgc').inner_text()
        self.assertIn('No scheduled canon progression',text)
        self.assertIn('Lantern | RANK: Spirit; Watcher',text)
        self.assertIn('Drain Syndrome: Year 3 of 10',text)

    def test_living_world_continuation_internal_states(self):
        html=FIXTURE['livingContinuationHtml']
        self.assertIn('Internal states',html)
        self.page.evaluate('(html)=>{const a=document.createElement("article");a.id="living-restored";a.innerHTML=html;document.body.append(a)}',html)
        self.assertEqual(self.page.locator('#living-restored .rs').count(),1)

    def test_durable_money_controls_and_legacy_review_notice(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_durable_tracking_history.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        money=self.page.locator('details[data-open-key="money"]')
        self.assertIn('could not be matched uniquely',money.inner_text())
        self.assertEqual(money.get_by_label('Mark settled',exact=True).count(),2)
        money.get_by_label('Mark settled',exact=True).first.click()
        event=self.page.evaluate("sent.filter(x=>x.type==='money').at(-1)")
        self.assertEqual(event['op'],'settle')
        self.assertTrue(event['id'].startswith('money:v1:'))
        money.get_by_label('Confirm review of older money corrections',exact=True).click()
        review=self.page.evaluate("sent.filter(x=>x.type==='money').at(-1)")
        self.assertEqual(review['op'],'review_legacy')
        self.assertEqual(review['ids'],['cash:1'])
        text=self.page.locator('.rpgc').inner_text()
        self.assertIn('Survey compass',text)
        self.assertIn('Explorers Guild',text)
        self.assertIn('Repair the aqueduct',text)

    def test_ability_alias_evidence_and_closed_scene_quests(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_ability_quest_evidence.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        chips=self.page.locator('.rpgc-chip.abil').filter(has_text='Grounding force absorption')
        self.assertEqual(chips.count(),1)
        self.assertIn('40%',chips.first.get_attribute('title'))
        self.assertIn('first teacher sign-off',chips.first.get_attribute('title'))
        quests=self.page.locator('.rpgc-qcard')
        self.assertEqual(quests.filter(has_text='Final trial').locator('.qst').inner_text(),'closed')
        self.assertEqual(quests.filter(has_text='Morning Sword Drill').locator('.qst').inner_text(),'failed')
        self.assertEqual(quests.filter(has_text='Sword style training').locator('.qst').inner_text(),'active')

    def test_continuing_agenda_and_quest_stage_render_once(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_agenda_quest_continuity.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        agenda=self.page.locator('.rpgc-agenda-item').filter(has_text='Doubled sparring sessions with Father')
        self.assertEqual(agenda.count(),1)
        quests=self.page.locator('.rpgc-qcard').filter(has_text='Doubled sparring sessions')
        self.assertEqual(quests.count(),1)
        self.assertIn('Report ten minutes before the first bell',quests.inner_text())
        agenda.get_by_role('button',name='✓: Doubled sparring sessions with Father',exact=True).click()
        event=self.page.evaluate("sent.filter(x=>x.type==='agenda').at(-1)")
        self.assertEqual(event['key'],hms['agenda']['items'][0]['key'])
        self.assertEqual(event['state'],'kept')

    def test_universal_agenda_wording_and_bell_time_render_once(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_universal_agenda_dedup.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        agenda=self.page.locator('.rpgc-agenda-item').filter(has_text='Supply contract review')
        self.assertEqual(agenda.count(),1)
        self.assertIn('nine o’clock bell',agenda.inner_text())
        self.assertIsNone(hms['agenda']['items'][0]['dueIn'])
        agenda.get_by_role('button',name='✓: Supply contract review meeting with Nia Vale',exact=True).click()
        event=self.page.evaluate("sent.filter(x=>x.type==='agenda').at(-1)")
        self.assertEqual(event['key'],'review the supply contract')
        self.assertEqual(event['state'],'kept')

    def test_exact_sparring_bell_clock_and_courtyard_duplicate_renders_once(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_agenda_bell_refinement.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        row=self.page.locator('.rpgc-agenda-item').filter(has_text='Spar with Cassian in the yard')
        self.assertEqual(row.count(),1)
        self.assertIn('Veyrath Hall courtyard',row.inner_text())
        self.assertEqual(hms['agenda']['items'][0]['dueIn'],15)
        row.get_by_role('button',name='✓: Spar with Cassian in the yard',exact=True).click()
        event=self.page.evaluate("sent.filter(x=>x.type==='agenda').at(-1)")
        self.assertEqual(event['key'],'spar with cassian in the yard')

    def test_durable_people_agenda_secrets_xp_and_carried_render(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_six_sided_acceptance.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        text=self.page.locator('.rpgc').inner_text()
        for value in ['Alden Vale','Review the training folio','The signal is blue','Survey compass']:
            self.assertIn(value,text)
        self.assertEqual(hms['you']['xp']['total'],20)
        self.assertFalse(hms['relations']['people'][0]['present'])
        self.assertIn('20 / 100 XP',text)
        payload['hms']['gear']=None
        self.receive(payload)
        remove=self.page.get_by_label('Remove Survey compass',exact=True)
        self.assertTrue(remove.is_visible())
        remove.click()
        event=self.page.evaluate("sent.filter(x=>x.type==='pocket').at(-1)")
        self.assertEqual(event['op'],'remove')
        self.assertEqual(event['key'],'survey compass')

    def test_long_history_family_property_and_unverified_mastery_render(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_six_sided_release_integrity.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        text=self.page.locator('.rpgc').inner_text()
        self.assertIn('Alden Vale',text)
        self.assertIn('Workshop',text)
        self.page.get_by_label('Find a spell',exact=True).fill('ice pillar')
        row=self.page.locator('.rpgc-spell-row[data-find^="ice pillar "]')
        self.assertTrue(row.is_visible())
        self.assertNotIn('mastered',row.get_attribute('class').split())
        self.assertIn('unverified',row.inner_text())

    def test_unlisted_spell_reference_label_preserves_known_and_studying(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_narrator_spell_grounding.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        magic=self.page.locator('details[data-open-key="magic"]')
        self.page.get_by_label('Find a spell',exact=True).fill('water sphere')
        row=magic.locator('.rpgc-spell-row.known[data-find^="water sphere "]')
        self.assertTrue(row.is_visible())
        self.assertIn('Not found in loaded spell references',row.inner_text())
        self.assertIn('Known',row.inner_text())
        self.assertEqual(magic.locator('.rpgc-spell-row.known[data-find^="water ball "]').count(),1)
        self.assertIn('Custom Beacon',magic.inner_text())

    def test_martial_classification_preserves_magic_counts_search_and_controls(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_magic_classification.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        payload['world']['covers']=[]
        self.receive(payload)
        magic=self.page.locator('details[data-open-key="magic"]')
        abilities=self.page.locator('details[data-open-key="abilities"]')
        self.assertIn('3 spells',magic.locator(':scope > summary').inner_text())
        self.assertNotIn('Feint with rhythm-breaking footwork',magic.inner_text())
        self.assertIn('Feint with rhythm-breaking footwork',abilities.inner_text())
        self.assertIn('Training',abilities.inner_text())
        self.assertIn('Touki (Battle Aura):',abilities.inner_text())
        self.assertIn('Active',abilities.inner_text())
        self.page.get_by_label('Find a spell',exact=True).fill('stone cannon')
        row=magic.locator('.rpgc-spell-row.study[data-find^="stone cannon "]')
        self.assertTrue(row.is_visible())
        row.get_by_title('Mark it learned',exact=True).click()
        event=self.page.evaluate("sent.filter(x=>x.type==='spell_known').at(-1)")
        self.assertEqual(event['name'],'Stone Cannon')
        self.assertTrue(event['on'])

    def test_six_sided_owned_list_and_family_alias_payload_render(self):
        observed=json.loads(subprocess.check_output(['node',str(ROOT/'tools/dual_browser_fixture.cjs')],text=True))
        self.assertEqual(len(observed['hms']['family']['members']),1)
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload.update(observed)
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-spell-row.known[data-find^="water ball "]').count(),1)
        self.assertEqual(self.page.locator('.rpgc-spell-row.known[data-find^="squall "]').count(),1)
        self.assertIn('Alden Vale',self.page.locator('.rpgc').inner_text())

    def test_renamed_quest_focus_uses_stable_key_and_renders_failed_state(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['systems']['quests']=[{'key':'original assignment','name':'Revised assignment','state':'failed','cls':'failed','objective':'Diagnose the aqueduct <img src=x onerror="window.bad=true">','progress':None}]
        payload['hms']['systems']['questFocus']='original assignment'
        self.receive(payload)
        row=self.page.locator('.rpgc-qcard.failed')
        self.assertIn('Revised assignment',row.inner_text())
        self.assertIn('failed',row.inner_text())
        self.page.get_by_label('Unfocus this quest',exact=True).click()
        sent=self.page.evaluate("sent.filter(x=>x.type==='quest_focus').at(-1)")
        self.assertEqual(sent['key'],'original assignment')
        self.assertFalse(self.page.evaluate('!!window.bad'))

    def test_grouped_spell_audit_shows_individual_known_catalogue_rows(self):
        payload=json.loads(subprocess.check_output(['node',str(ROOT/'tools/magic_browser_fixture.cjs')],text=True))
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-spell-row.known[data-find^="squall "]').count(),1)
        ground=self.page.locator('.rpgc-spell-row.known[data-find^="ground sense "]')
        self.assertEqual(ground.count(),1)
        self.assertIn('weak — never held over distance',ground.inner_text())
        self.assertNotIn('Water Magic (Advanced): Squall',self.page.locator('.rpgc').inner_text())
        self.page.get_by_label('Find a spell',exact=True).fill('squall')
        self.assertTrue(self.page.locator('.rpgc-spell-row.known[data-find^="squall "]').is_visible())

    def test_known_spell_weakness_note_is_text_not_markup(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        row=payload['hms']['magic']['list']['schools'][0]['spells'][0]
        row.update(status='known',note='Weak at range <img src=x onerror="window.bad=true">')
        self.receive(payload)
        self.assertIn(row['note'],self.page.locator('.rpgc').inner_text())
        self.assertFalse(self.page.evaluate('!!window.bad'))

    def test_export_identity_drift_renders_one_appointment_and_quest_after_restore(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_export_identity_drift.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        for _ in range(3):
            self.receive(json.loads(json.dumps(payload)))
            self.assertEqual(self.page.locator('.rpgc-agenda-item').count(),1)
            self.assertEqual(self.page.locator('.rpgc-qcard').count(),1)
            self.assertIn('Veyrath Hall courtyard',self.page.locator('.rpgc-agenda-item').inner_text())
            self.assertIn('Defeat Cassian or force him to acknowledge Marcus as an equal',self.page.locator('.rpgc-qcard').inner_text())
        self.assertEqual(hms['systems']['questFocus'],'prove yourself against cassian')
        self.page.get_by_label('Unfocus this quest',exact=True).click()
        event=self.page.evaluate("sent.filter(x=>x.type==='quest_focus').at(-1)")
        self.assertEqual(event['key'],'prove yourself against cassian')

    def test_extended_quest_contract_restoration_refresh_and_controls(self):
        hms=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_quest_contract_continuity.cjs'),'--browser-fixture'],text=True))
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=hms
        old=json.loads(json.dumps(payload))
        old['hms']['systems']['quests']=[dict(hms['systems']['quests'][0],key='old-'+str(i),name='Old alias '+str(i)) for i in range(5)]
        self.receive(old)
        self.assertEqual(self.page.locator('.rpgc-qcard').count(),5)
        for _ in range(10):
            self.receive(json.loads(json.dumps(payload)))
            self.assertEqual(self.page.locator('.rpgc-qcard').count(),1)
        card=self.page.locator('.rpgc-qcard')
        self.assertIn('Defeat Cassian or force him to acknowledge Marcus as an equal',card.inner_text())
        self.assertEqual(hms['systems']['quests'][0]['progress'],60)
        self.page.get_by_label('Unfocus this quest',exact=True).click()
        self.assertEqual(self.page.evaluate("sent.filter(x=>x.type==='quest_focus').at(-1).key"),'prove yourself against cassian')

    def test_internal_states_tabs_and_collapse(self):
        self.page.add_style_tag(content=FIXTURE['statesCss'])
        self.page.evaluate('(html)=>{let reply=document.createElement("article");reply.id="reply";reply.innerHTML=html;document.body.append(reply)}',FIXTURE['internalStates'])
        states=self.page.locator('#reply .rs')
        self.assertIn('internal states',states.inner_text().lower())
        for label in states.locator('label').all():
            label.click(force=True)
        summary=states.locator('summary').first
        summary.click()
        self.assertFalse(states.locator('details').first.evaluate('(e)=>e.open'))
        summary.click()
        self.assertTrue(states.locator('details').first.evaluate('(e)=>e.open'))

    def test_relationship_defaults_and_explicit_mode_persistence(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_relationship_defaults_drift.cjs'),'--browser-fixture'],text=True))
        pair=payload['hms']['minds']['people'][0]['pairs'][0]
        self.assertTrue(pair['guessed'])
        self.receive(payload)
        mode=self.page.locator('.rpgc-pair .rpgc-chip.mode')
        self.assertEqual(mode.inner_text(),'warm')
        self.assertEqual(mode.get_attribute('title'),'Derived default; no mode reported')
        pair['mode']='stranger';pair.pop('modeSource',None)
        self.receive(payload)
        self.assertEqual(mode.inner_text(),'stranger')
        self.assertIsNone(mode.get_attribute('title'))
        pair['mode']='not reported';pair['modeSource']='not-reported'
        self.receive(payload)
        self.assertEqual(mode.inner_text(),'not reported')
        self.assertIn('first guess',self.page.locator('.rpgc-pair').inner_text())

    def test_relationship_advisory_lists_npc_transition_and_reason_safely(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']=json.loads(subprocess.check_output(['node',str(ROOT/'tools/test_relationship_defaults_drift.cjs'),'--browser-fixture'],text=True))
        self.receive(payload)
        panel=self.page.locator('.rpgc-consistency')
        self.assertIn('Standing fell despite a positive stated reason',panel.inner_text())
        self.assertIn('Guild clerk (Close → Friend)',panel.inner_text())
        self.assertIn('grateful for your kindness',panel.inner_text())
        payload['hms']['consistency'][0]['reason']='<img src=x onerror="window.bad=true">'
        self.receive(payload)
        self.assertEqual(panel.locator('img').count(),0)
        self.assertIn('<img',panel.inner_text())
        self.assertFalse(self.page.evaluate('Boolean(window.bad)'))

    def test_31_consistency_and_family_labels(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['consistency']=[{'code':'clock','message':'HUD time or date moved backwards'}]
        payload['hms']['family']={'members':[{'key':'parent','name':'Parent','relation':'father','status':'alive','where':'Study','known':'seen','since':30,'present':False,'seenAgo':30,'everSeen':True,'doing':'Likely at breakfast','doingNow':False,'history':[],'changes':[],'alerts':[]}],'ask':True,'hidden':0}
        self.receive(payload)
        self.assertIn('HUD time or date moved backwards',self.page.locator('.rpgc-consistency').inner_text())
        self.assertIn('last seen',self.page.locator('.rpgc-fam-where').inner_text())
        self.assertIn('30m',self.page.locator('.rpgc-fam-where').inner_text())
        detail=self.page.locator('details.rpgc-fam-doing')
        detail.evaluate('(e)=>e.open=false')
        self.assertFalse(detail.locator('span').is_visible())
        detail.locator('summary').click()
        self.assertIn('Likely at breakfast',detail.inner_text())

    def test_31_character_sheet_download_is_read_only(self):
        before=self.page.evaluate('sent.length')
        with self.page.expect_download() as event:
            self.page.get_by_role('button',name='Export character sheet',exact=True).click()
        download=event.value
        text=pathlib.Path(download.path()).read_text()
        self.assertEqual(download.suggested_filename,'rpg-companion-character-sheet.md')
        self.assertIn('# Character sheet',text)
        self.assertIn('## World state',text)
        self.assertEqual(self.page.evaluate('sent.length'),before)

    def test_31_snapshot_restore_is_read_only_and_chat_isolated(self):
        self.page.get_by_label('Snapshot name',exact=True).fill('Before the spar')
        self.page.get_by_role('button',name='Save snapshot',exact=True).click()
        request=self.page.evaluate('sent.at(-1)')
        self.assertEqual(request['type'],'tracker_snapshot')
        self.assertEqual(request['op'],'save')
        payload=json.loads(json.dumps(FIXTURE['payload']))
        saved={'hms':{'hud':{'lines':[{'text':'Past location: Observatory'}]}}}
        payload['trackerSnapshots']={'list':[{'id':'snap1','name':'Before the spar'}],'active':None,'view':None}
        self.receive(payload)
        self.page.get_by_role('button',name='Restore view',exact=True).click()
        self.assertEqual(self.page.evaluate('sent.at(-1).op'),'restore')
        payload['trackerSnapshots'].update(active='snap1',view=saved)
        self.receive(payload)
        self.assertIn('Past location: Observatory',self.page.locator('.rpgc-snapshot-view').inner_text())
        self.assertEqual(self.page.locator('[contenteditable]').count(),0)
        self.assertEqual(self.page.locator('.rpgc-spell-row').count(),0)
        self.page.get_by_role('button',name='Return to live tracking',exact=True).click()
        self.assertEqual(self.page.evaluate('sent.at(-1).op'),'live')
        self.page.evaluate("activeChat={chatId:'next-chat',characterId:'character'};hostEvents.CHAT_SWITCHED()")
        self.assertNotIn('Past location: Observatory',self.page.locator('.rpgc').inner_text())

    def test_31_relationship_web_lazy_bounded_mobile_and_float(self):
        self.page.locator('.rpgc-relationship-web > summary').click()
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['hms']['minds']={'people':[{'key':'p'+str(i),'name':'Person '+str(i),'pairs':[{'to':'p'+str((i+1)%30),'toName':'Person '+str((i+1)%30),'axes':[],'you':False}],'feel':None} for i in range(30)]}
        # Avoid person-card fields: graph consumes the existing Minds payload directly.
        payload['hms']['minds']['people'][0]['name']='LongUnbrokenName'*8
        payload['hms']['relations']=None
        self.page.evaluate('(p)=>window.receive(p)',payload)
        web=self.page.locator('.rpgc-relationship-web')
        self.assertEqual(web.locator('svg').count(),0)
        web.locator('summary').click()
        web.locator('svg').wait_for(state='visible')
        self.assertEqual(web.locator('svg circle').count(),20)
        self.assertLessEqual(web.locator('svg line').count(),80)
        self.assertIn('11 people omitted',web.inner_text())
        self.assertLessEqual(web.locator('svg').bounding_box()['width'],320)
        self.assertTrue(web.locator('.rpgc-web-body').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
        self.page.get_by_label('Where the panel lives').select_option('float')
        self.assert_float_inside_viewport()

    def test_31_canon_only_explicit_outcomes(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['world']['saga']={'arcs':[],'from':400,'to':500,'year':417,'current':None,'personalArc':'Sandbox — own story','events':[{'name':'Changed event','state':'changed','detail':'Explicit change'},{'name':'Prevented event','state':'prevented','detail':'Explicit prevention'}]}
        payload['hms']['hud']['lines'].append({'key':'next canon event','text':'Next Canon Event: Future event — in one month'})
        self.receive(payload)
        panel=self.page.locator('.rpgc-canon-divergence')
        self.assertIn('Future event',panel.inner_text())
        self.assertIn('pending',panel.inner_text())
        self.assertIn('Explicit change',panel.inner_text())

    def test_31_compact_light_theme_contrast(self):
        payload=json.loads(json.dumps(FIXTURE['payload']))
        payload['settings'].update(compactMobile=True,uiTheme='mushoku')
        self.receive(payload)
        self.assertEqual(self.page.locator('.rpgc-mobile-pinned').evaluate('(e)=>getComputedStyle(e).backgroundColor'),'rgb(253, 247, 234)')

    def test_31_compact_mobile_320_360(self):
        for width in [320,360]:
            for mode in ['drawer','float']:
                with self.subTest(width=width,mode=mode):
                    payload=json.loads(json.dumps(FIXTURE['payload']))
                    payload['settings'].update(compactMobile=True,uiPanelMode=mode)
                    self.page.set_viewport_size({'width':width,'height':800})
                    self.receive(payload)
                    pinned=self.page.locator('.rpgc-mobile-pinned')
                    self.assertTrue(pinned.is_visible())
                    self.assertEqual(pinned.evaluate('(e)=>getComputedStyle(e).position'),'sticky')
                    self.assertIn('Who is here',pinned.inner_text())
                    self.assertIn('Quests',pinned.inner_text())
                    self.assertLessEqual(pinned.bounding_box()['width'],width)
                    if mode=='float':self.assert_float_inside_viewport()


if __name__=='__main__' and args.measure:
    BrowserUi.setUpClass()
    test=BrowserUi()
    try:
        test.setUp()
        times=test.page.evaluate('''(payload)=>{
            const samples=[];
            for(let i=0;i<25;i++){
                const start=performance.now();receive(structuredClone(payload));
                document.querySelector('.rpgc').getBoundingClientRect();
                if(i>=5)samples.push(performance.now()-start);
            }
            return samples;
        }''',FIXTURE['payload'])
        pathlib.Path(args.measure).write_text(json.dumps({'frontend':args.frontend,'renderLayoutMs':times}))
    finally:
        test.tearDown();BrowserUi.tearDownClass()
elif __name__=='__main__':
    unittest.main(argv=[__file__,*remaining],verbosity=2)
