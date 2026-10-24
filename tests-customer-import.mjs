import assert from 'node:assert/strict';
import {parseCSV,bindCustomerImport} from './live-customer-import.mjs';
assert.deepEqual(parseCSV('\ufeffName,Phone\r\n"A, B",01712345678\r\n"Two\nlines",01812345678'),[['Name','Phone'],['A, B','01712345678'],['Two\nlines','01812345678']]);
assert.throws(()=>parseCSV('name,phone\n"bad,123'),/unclosed/);
const button={},controls=[button],form={dataset:{},querySelectorAll:()=>controls,querySelector:()=>button},status={},preview={innerHTML:'',querySelector:s=>s==='form'?form:status},picker={disabled:true,removeAttribute(){}};
const root={isConnected:true,querySelector:s=>s==='input[type=file]'?picker:preview},calls=[];
bindCustomerImport(root,{section:'import',shop:{id:'shop-a',name:'Ecory'}},{rpc:async(name,args)=>{calls.push({name,args});return 'id'}});
assert.equal(picker.disabled,false);picker.files=[{name:'customers.csv',size:90,text:async()=> 'Customer Name,Phone Number,Address\nCustomer,01712345678,"A, B"'}];await picker.onchange();
assert.ok(preview.innerHTML.includes('customer profiles only'));assert.ok(preview.innerHTML.includes('type="checkbox" required'));
const NativeFormData=globalThis.FormData;globalThis.FormData=class{get(name){return ({full_name:'0',phone:'1',address:'2'})[name]??''}};
try{await form.onsubmit({preventDefault(){}});assert.equal(calls.length,1);assert.equal(calls[0].args.target_shop,'shop-a');assert.deepEqual(calls[0].args.details,{full_name:'Customer',phone:'01712345678',address:'A, B'});assert.ok(!('assigned_membership_id' in calls[0].args.details));assert.ok(status.textContent.includes('1 customer rows saved'));}finally{globalThis.FormData=NativeFormData}
picker.files=[{name:'bad.xlsx',size:10}];await picker.onchange();assert.ok(preview.innerHTML.includes('Choose a CSV file'));
console.log('CSV parsing, file selection, tenant-scoped save, assignment preservation and invalid file handling passed.');
