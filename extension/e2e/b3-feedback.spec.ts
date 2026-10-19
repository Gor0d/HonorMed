import {test,expect} from "@playwright/test";
import path from "node:path";
test("suporte abre somente a URL pública, sem dados ou autenticação",async({page})=>{
 await page.addInitScript(()=>{
  (window as any).chrome={storage:{session:{get:async()=>({}),set:async()=>{},remove:async()=>{},clear:async()=>{}},local:{get:async()=>({}),set:async()=>{},remove:async()=>{},clear:async()=>{}}},tabs:{create:async({url}:{url:string})=>{(window as any).__feedbackUrl=url;}}};
 });
 await page.route("http://127.0.0.1:3791/**",async route=>{const name=new URL(route.request().url()).pathname.slice(1);if(!/^(popup\.html|popup\.css|popup\.js|logo-primary\.png)$/.test(name))return route.fulfill({status:404});await route.fulfill({path:path.resolve("dist",name),contentType:name.endsWith(".js")?"text/javascript":undefined});});
 await page.goto("http://127.0.0.1:3791/popup.html");
 for(const width of [390,1280]) {
  await page.setViewportSize({width,height:900});
  await page.getByRole("button",{name:"Feedback e suporte"}).click();
  const url=new URL(await page.evaluate(()=>(window as any).__feedbackUrl));expect(url.pathname).toBe("/suporte");expect(url.search).toBe("");expect(url.hash).toBe("");
 }
});
