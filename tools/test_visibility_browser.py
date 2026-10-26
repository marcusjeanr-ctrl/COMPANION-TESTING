#!/usr/bin/env python3
"""Real Chromium visibility/heartbeat tests against actual frontend, mocked host."""
import argparse,json,os,pathlib,subprocess,unittest
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--frontend',default=str(ROOT/'dist/frontend.js'));args=parser.parse_args()
SOURCE=pathlib.Path(args.frontend).read_text().replace('export function setup','window.setup = function')
FIXTURE=json.loads(subprocess.check_output(['node',str(ROOT/'tools/ui_browser_fixture.cjs')],text=True))['payload']
class VisibilityTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.playwright=sync_playwright().start();cls.browser=cls.playwright.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'))
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.playwright.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':500,'height':800});self.page=self.context.new_page();self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.set_content('<div id="drawer" style="height:100vh;overflow:auto"></div>')
  self.page.evaluate('window.timers=[];window.setInterval=(f,ms)=>{timers.push({f,ms});return timers.length};window.clearInterval=()=>{}')
  if self._testMethodName=='test_legacy_host_keeps_refresh_without_observer':
   self.page.evaluate('window.IntersectionObserver=undefined;document.querySelector("#drawer").style.display="none"')
  self.page.add_script_tag(content=SOURCE)
  self.page.evaluate('''() => {window.sent=[];window.hostEvents={};window.activeChat={chatId:'test',characterId:'character'};window.dispose=setup({dom:{addStyle(css){const s=document.createElement('style');s.textContent=css;document.head.append(s);return ()=>s.remove()}},ui:{registerDrawerTab(){return {root:document.querySelector('#drawer'),activate(){},destroy(){}}},registerInputBarAction(){return {onClick(){},setEnabled(){},destroy(){}}}},sendToBackend(x){sent.push(x)},onBackendMessage(fn){window.receive=fn;return ()=>{}},getActiveChat(){return activeChat},events:{on(ev,fn){hostEvents[ev]=fn;return ()=>{}}}})}''')
  self.receive(FIXTURE);self.page.wait_for_timeout(100);self.clear()
 def tearDown(self):
  self.page.evaluate('dispose()');self.context.close();self.assertEqual(self.errors,[])
 def receive(self,payload):self.page.evaluate('p=>receive(p)',payload)
 def clear(self):self.page.evaluate('sent.length=0')
 def ticks(self):self.page.evaluate('for(let i=0;i<6;i++)for(const t of timers)if(t.ms===1000)t.f()')
 def requests(self):return self.page.evaluate('sent.filter(x=>x.type==="get_state")')
 def hide(self):self.page.evaluate('document.querySelector("#drawer").style.display="none"');self.page.wait_for_timeout(100);self.clear()
 def show(self):self.page.evaluate('document.querySelector("#drawer").style.display="block"');self.page.wait_for_timeout(100)
 def test_hidden_idle_defers_refresh_and_render_then_catches_up(self):
  self.hide();before=self.page.locator('.rpgc').inner_html();self.ticks();self.assertEqual(self.requests(),[])
  payload=json.loads(json.dumps(FIXTURE));payload['hms']['gear']['items'][0]['name']='Updated while hidden'
  self.receive(payload);self.assertEqual(self.page.locator('.rpgc').inner_html(),before)
  self.show();self.assertEqual(len(self.requests()),1);self.assertIn('Updated while hidden',self.page.locator('.rpgc').inner_text())
  self.clear();self.ticks();self.assertEqual(len(self.requests()),1,'Visible heartbeat must survive')
 def test_hidden_events_preserve_generation_relay_and_new_chat(self):
  self.hide()
  self.page.evaluate('''()=>{for(const ev of ['MESSAGE_SWIPED','SWIPE_EDITED','MESSAGE_DELETED','PERSONA_CHANGED'])hostEvents[ev]({chatId:'test'});hostEvents.GENERATION_ENDED({chatId:'test',messageId:'a2'});activeChat={chatId:'other',characterId:'new'};hostEvents.CHAT_SWITCHED();}''')
  self.assertEqual(self.requests(),[]);self.assertEqual(self.page.evaluate('sent.filter(x=>x.type==="gen_ended").length'),1)
  self.show();self.assertEqual(len(self.requests()),1);self.assertEqual(self.requests()[0]['chatId'],'other');self.assertTrue(self.requests()[0]['refreshName'])
 def test_float_visibility_is_independent_of_drawer(self):
  payload=json.loads(json.dumps(FIXTURE));payload['settings']['uiPanelMode']='float';self.receive(payload);self.hide();self.ticks();self.assertEqual(len(self.requests()),1)
  self.page.get_by_label('Minimise',exact=True).click();self.page.wait_for_timeout(100);self.clear();self.ticks();self.assertEqual(self.requests(),[])
  self.page.get_by_label('Minimise',exact=True).click();self.page.wait_for_timeout(100);self.assertEqual(len(self.requests()),1)
 def test_legacy_host_keeps_refresh_without_observer(self):
  self.ticks();self.assertEqual(len(self.requests()),1,'Unknown visibility must retain the original heartbeat')
  self.show();self.assertTrue(self.page.locator('.rpgc').inner_text())
 def test_popout_visibility_is_independent_of_drawer(self):
  payload=json.loads(json.dumps(FIXTURE));payload['settings']['uiPanelMode']='popout'
  with self.context.expect_page() as opened:self.receive(payload)
  pop=opened.value;pop.wait_for_load_state();self.page.wait_for_timeout(100);self.hide();self.ticks();self.assertEqual(len(self.requests()),1)
  self.assertEqual(pop.locator('.rpgc').count(),1)
  pop.close();self.page.wait_for_timeout(100);self.clear();self.ticks();self.assertEqual(self.requests(),[],'Closed popout must follow hidden drawer')
if __name__=='__main__':unittest.main(argv=[__file__],verbosity=2)
