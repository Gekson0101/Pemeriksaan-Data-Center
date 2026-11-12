(function(root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function rowsFor(assets, rules, period) {
    const rows=assets.filter(a => a.active).flatMap(a => rules.filter(t => t.category === a.category && t.period === period && (!t.applies || a.subtype === 'system' || t.applies.includes(a.subtype))).map(t => ({
      id: `${a.id}__${t.id}`, assetId:a.id, assetCode:a.code, assetName:a.name, location:a.location, category:a.category,
      templateId:t.id, title:t.title, period:t.period, source:t.source, sourceUrl:t.sourceUrl, originalPeriod:t.originalPeriod,
      criterion:t.criterion, method:t.method, role:t.role, measurement:!!t.measurement,
      inspectionObjects:reportObjects(t),categoryName:root.DCIData?.categories.find(c=>c.id===a.category)?.name||a.category,
      status:'', reading:'', note:'', priority:'Sedang', pic:'', target:'', evidence:[], checkedAt:null
    })));
    return groupByCategory(rows).flatMap(group=>group.rows);
  }
  function metrics(rows) {
    const counts={total:rows.length,pass:0,fail:0,na:0,deferred:0,pending:0};
    rows.forEach(r=>{if(r.status==='pass')counts.pass++;else if(r.status==='fail')counts.fail++;else if(r.status==='na')counts.na++;else if(r.status==='deferred')counts.deferred++;else counts.pending++;});
    counts.answered=counts.total-counts.pending;
    counts.inspected=counts.pass+counts.fail;
    counts.applicable=counts.total-counts.na;
    counts.completion=counts.total?Math.round(100*counts.answered/counts.total):0;
    counts.coverage=counts.applicable?Math.round(100*counts.inspected/counts.applicable):null;
    return counts;
  }
  function incompleteFields(session, simple = false) {
    const items=[];
    for(const row of groupByCategory(session.rows||[]).flatMap(group=>group.rows)) {
      if(!(simple ? ['pass','fail'] : ['pass','fail','na','deferred']).includes(row.status))items.push({rowId:row.id,assetId:row.assetId,field:'status',message:'Pilih hasil pemeriksaan untuk butir ini.'});
      else if(['fail','na','deferred'].includes(row.status)&&!row.note?.trim())items.push({rowId:row.id,assetId:row.assetId,field:'note',message:simple ? 'Isi keterangan untuk hasil tidak sesuai.' : 'Lengkapi uraian temuan atau alasan untuk butir ini.'});
      else if(!simple&&row.measurement&&row.status==='pass'&&!row.reading?.trim())items.push({rowId:row.id,assetId:row.assetId,field:'reading',message:'Lengkapi nilai atau rujukan hasil ukur untuk butir ini.'});
    }
    if(!session.inspector?.trim())items.push({field:'inspector',message:'Isi nama petugas pemeriksa.'});
    if(!session.site?.trim())items.push({field:'site',message:'Isi nama lokasi pusat data.'});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(session.date||''))items.push({field:'date',message:'Isi tanggal pemeriksaan.'});
    return items;
  }
  function validate(session, simple = false) {
    if(simple && session.rows?.length) return incompleteFields(session, true).map(issue=>issue.message);
    const errors=[];
    if(!session.inspector?.trim())errors.push('Nama petugas wajib diisi.');
    if(!session.site?.trim())errors.push('Nama lokasi pusat data wajib diisi.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(session.date||''))errors.push('Tanggal pemeriksaan wajib diisi.');
    if(!session.rows?.length)errors.push('Pilih sedikitnya satu aset dengan butir pemeriksaan.');
    let pending=0,notes=0,readings=0;
    for(const row of session.rows||[]) {
      if(!['pass','fail','na','deferred'].includes(row.status))pending++;
      if(['fail','na','deferred'].includes(row.status)&&!row.note?.trim())notes++;
      if(row.measurement&&row.status==='pass'&&!row.reading?.trim())readings++;
    }
    if(pending)errors.push(`${pending} butir belum diisi. Gunakan Tertunda beserta alasan bila belum dapat diperiksa.`);
    if(notes)errors.push(`${notes} butir memerlukan uraian temuan atau alasan N/A/Tertunda.`);
    if(readings)errors.push(`${readings} butir pengukuran memerlukan nilai atau rujukan hasil ukur.`);
    return errors;
  }
  const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function csvCell(value) {
    let s=String(value??'');
    if(/^[\t\r\n]|^\s*[=+\-@]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function groupByCategory(rows) {
    const categories=root.DCIData?.categories||[];
    const groups=new Map();
    for (const row of rows) {
      if (!groups.has(row.category)) groups.set(row.category,{
        id:row.category,
        name:categories.find(category=>category.id===row.category)?.name||row.categoryName||row.category,
        rows:[]
      });
      groups.get(row.category).rows.push(row);
    }
    const order=new Map(categories.map((category,index)=>[category.id,index]));
    return [...groups.values()].sort((a,b)=>(order.get(a.id)??Number.MAX_SAFE_INTEGER)-(order.get(b.id)??Number.MAX_SAFE_INTEGER));
  }
  function groupByAsset(rows) {
    const groups = new Map();
    for (const row of groupByCategory(rows).flatMap(group=>group.rows)) {
      const key = row.assetId || row.assetCode || JSON.stringify([row.assetName, row.location]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return [...groups.values()];
  }
  function reportObjects(row) {
    if (Array.isArray(row.inspectionObjects)) return [...row.inspectionObjects];
    const reference=root.DCIData?.dailyReportObjects?.[row.templateId||row.id];
    const title=root.DCIData?.formalLabel(row.title)||row.title;
    // Keep custom and historical wording separate from the template's scope.
    return reference?.title===title ? [...reference.objects] : [];
  }
  function csv(session) {
    const data=root.DCIData;
    const status={pass:'Sesuai',fail:'Tidak sesuai',na:'Tidak berlaku',deferred:'Tertunda','':'Belum dinilai'};
    const header=['Nomor laporan','Periode','Tanggal pemeriksaan','Petugas','Pusat data','Kategori','Kode aset','Nama aset','Lokasi aset','Parameter pemeriksaan','Hasil','Hasil ukur','Keterangan petugas','Jumlah foto','Prioritas','PIC','Target tindak lanjut'];
    const rows=groupByAsset(session.rows||[]).flat().map(row=>[
      session.number||'DRAF',data.periods[session.period]||session.period,session.date,session.inspector,session.site,
      data.categories.find(category=>category.id===row.category)?.name||row.category,
      row.assetCode,data.formalLabel(row.assetName),row.location,data.formalLabel(row.title),
      status[row.status]||'Belum dinilai',row.reading,row.note,row.evidence?.length||0,
      row.status==='fail'?row.priority:'',row.pic,row.target
    ]);
    return '\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
  }
  function updateDemoAssetNames(state,data) {
    if (state.demoAssetNamingVersion===data.demoAssetNamingVersion) return;
    const updates=new Map(data.demoAssetRenames.map(entry=>[entry.id,entry]));
    const renamed=new Set();
    for (const asset of state.assets) {
      const entry=updates.get(asset.id);
      if (!entry || asset.code!==entry.code || asset.category!==entry.category || asset.subtype!==entry.subtype) continue;
      if (data.formalLabel(asset.name)!==data.formalLabel(entry.previousName)) continue;
      asset.name=entry.name;
      if (entry.previousLocations.includes(asset.location)) asset.location=entry.location;
      renamed.add(asset.id);
    }
    for (const draft of state.drafts||[]) {
      for (const row of draft.rows||[]) {
        const entry=updates.get(row.assetId);
        if (!entry || !renamed.has(row.assetId) || row.assetCode!==entry.code) continue;
        if (data.formalLabel(row.assetName)!==data.formalLabel(entry.previousName)) continue;
        row.assetName=entry.name;
        if (entry.previousLocations.includes(row.location)) row.location=entry.location;
      }
    }
    state.demoAssetNamingVersion=data.demoAssetNamingVersion;
  }
  function addDemoAssets(state,data) {
    if (state.demoAssetVersion===data.demoAssetVersion) return 0;
    const ids=new Set(state.assets.map(asset=>asset.id));
    const codes=new Set(state.assets.map(asset=>asset.code.trim().toLowerCase()));
    let added=0;
    for (const asset of data.extraDemoAssets) {
      if (ids.has(asset.id)) continue;
      const entry=clone(asset);
      let suffix=2;
      while (codes.has(entry.code.toLowerCase())) entry.code=`${asset.code}-${suffix++}`;
      state.assets.push(entry);
      ids.add(entry.id);
      codes.add(entry.code.toLowerCase());
      added++;
    }
    state.demoAssetVersion=data.demoAssetVersion;
    return added;
  }
  function periodKey(period,date) {
    const d=new Date(date+'T12:00:00');
    if(period==='daily')return date;
    if(period==='fiveyear')return String(Math.floor(d.getFullYear()/5)*5);
    if(period==='yearly')return date.slice(0,4);
    if(period==='monthly')return date.slice(0,7);
    if(period==='quarterly')return date.slice(0,4)+'-Q'+Math.ceil((d.getMonth()+1)/3);
    if(period==='weekly'){const weekday=(d.getDay()+6)%7;d.setDate(d.getDate()-weekday);return localDate(d);}
    throw new Error('Periode tidak dikenal');
  }
  function completedInspection(reports, session) {
    if (!session?.date || !session.site?.trim()) return;
    const siteKey = name => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const site = siteKey(session.site);
    return reports.find(report => {
      if (report.period !== session.period || siteKey(report.site) !== site || !report.date) return false;
      if (session.period !== 'fiveyear') return periodKey(report.period, report.date) === periodKey(session.period, session.date);
      const [first, last] = [report.date, session.date].sort();
      const nextYear = Number(first.slice(0, 4)) + 5;
      const month = Number(first.slice(5, 7)), day = Number(first.slice(8, 10));
      const anniversary = new Date(nextYear, month - 1, Math.min(day, new Date(nextYear, month, 0).getDate()), 12);
      return last < localDate(anniversary);
    });
  }
  function updateDailyParameters(state,data) {
    if(state.dailyParameterVersion===data.dailyParameterVersion)return {changed:false};
    const categories=new Set(data.categories.map(c=>c.id));
    const managed=rule=>rule.period==='daily'&&(rule.id.startsWith('user-dcos2021-daily-')||[...categories].some(id=>new RegExp('^'+id+'-daily-\\d+$').test(rule.id)));
    const replaced=state.rules.filter(managed);
    if(replaced.length){
      state.checklistRevisions=Array.isArray(state.checklistRevisions)?state.checklistRevisions:[];
      state.checklistRevisions.push({kind:'daily-parameters',replacedAt:new Date().toISOString(),fromVersion:state.dailyParameterVersion||'2026-11-04.1',toVersion:data.dailyParameterVersion,rules:clone(replaced)});
    }
    state.rules=[...state.rules.filter(rule=>!managed(rule)),...clone(data.rules.filter(rule=>rule.period==='daily'))];
    state.dailyParameterVersion=data.dailyParameterVersion;
    return {changed:true,replaced:replaced.length,added:data.rules.filter(rule=>rule.period==='daily').length};
  }
  function finalize(session,number,simple = false) {
    const errors=validate(session,simple);
    if(errors.length)throw new Error(errors.join('\n'));
    return {...clone(session),number,finalizedAt:new Date().toISOString(),status:session.rows.some(r=>r.status==='deferred')?'final-deferred':'final',templateSnapshotVersion:session.templateSnapshotVersion||'2026-11-04.1'};
  }
  function groupByParameter(rows) {
    const groups=new Map();
    for(const row of rows){const key=JSON.stringify([row.category,row.templateId||'',row.title]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
    return [...groups.values()];
  }
  const api={groupByParameter,clone,localDate,rowsFor,groupByCategory,groupByAsset,metrics,incompleteFields,validate,escape,csv,csvCell,reportObjects,addDemoAssets,updateDemoAssetNames,periodKey,completedInspection,updateDailyParameters,finalize};
  root.DCICore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
