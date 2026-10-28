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
            window.dispose=window.setup({dom:{addStyle(css){const s=document.createElement('style');s.textContent=css;document.head.append(s);return ()=>s.remove();}},
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
