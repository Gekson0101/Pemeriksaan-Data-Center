(async function() {
  'use strict';
  const D=window.DCIData,label=D.formalLabel,C=window.DCICore,e=C.escape,$=s=>document.querySelector(s);
  const simpleForm = true; // Use the current two-answer form on every screen size.
  const statusLabels={pass:'Sesuai',fail:'Tidak sesuai',na:'Tidak berlaku',deferred:'Tertunda','':'Belum diisi'};
  const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',check:'M5 12l4 4L19 6',list:'M9 6h12 M9 12h12 M9 18h12 M3 6h1 M3 12h1 M3 18h1',box:'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',file:'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h8',book:'M12 5C9 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-7-2-10 1z M12 5v16',arrow:'M5 12h14 M14 7l5 5-5 5',plus:'M12 5v14 M5 12h14',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',clock:'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',calendar:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16',download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',camera:'M3 7h4l2-3h6l2 3h4v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',alert:'M12 3L1 21h22z M12 9v5 M12 18h.01',dash:'M6 12h12',pause:'M8 5v14 M16 5v14',print:'M6 8V2h12v6 M6 18H3V8h18v10h-3 M6 14h12v8H6z',save:'M4 3h14l3 3v15H3V3z M7 3v7h10V3 M7 15h10v6',upload:'M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5',shield:'M12 2l9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6z M8 12l3 3 5-6',edit:'M15 4l5 5 M3 21l5-1L21 7l-5-5L3 16z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'};
  const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.box}"/></svg>`;
  const cat=id=>D.categories.find(c=>c.id===id)||{name:id,sourceUrl:''};
  const fmt=date=>{if(!date)return '—';const d=new Date(date.length===10?date+'T12:00:00':date);return isNaN(d)?'—':new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(d);};
  const time=value=>value?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value))+' WIB':'—';
  const uid=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let state,db,fallback=false,saveQueue=Promise.resolve(),toastTimer;
  const ui={view:'dashboard',draftId:null,reportId:null,query:'',category:'all',period:'daily',expanded:new Set(),ruleQuery:'',ruleCategory:'all',rulePeriod:'all',assetQuery:'',assetCategory:'all',historyPeriod:'all',historyQuery:'',historyDate:''};
  const fresh=()=>({schemaVersion:1,catalogVersion:D.version,dailyParameterVersion:D.dailyParameterVersion,demoAssetVersion:D.demoAssetVersion,demoAssetNamingVersion:D.demoAssetNamingVersion,site:'Pusat Data Demo',assets:C.clone(D.assets),rules:C.clone(D.rules),drafts:[],reports:[],createdAt:new Date().toISOString()});
  async function initDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('dc-inspect-prototype-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function readState(){return new Promise((resolve,reject)=>{const req=db.transaction('state').objectStore('state').get('main');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  let reportRevision;
  function writeState(snapshot, reportsChanged) {
    const next = reportsChanged ? uid('revision') : reportRevision;
    const stale = new Error('Riwayat berubah di tab lain. Muat ulang untuk melihat laporan terbaru.');
    stale.name = 'StaleHistory';
    snapshot.reportRevision = next;
    if (fallback) {
      const write = () => {
        const key = 'dc-inspect-fallback-v1';
        const stored = JSON.parse(localStorage.getItem(key) || 'null');
        if ((stored?.reportRevision || '') !== reportRevision) throw stale;
        localStorage.setItem(key, JSON.stringify(snapshot));
        reportRevision = next;
      };
      return navigator.locks ? navigator.locks.request('dc-inspect-history', write) : Promise.resolve().then(write);
    }
    return new Promise((resolve,reject) => {
      const tx = db.transaction('state','readwrite'), store = tx.objectStore('state');
      const revision = store.get('reportRevision');
      let conflict = false;
      revision.onsuccess = () => {
        if ((revision.result || '') !== reportRevision) {conflict=true;tx.abort();return;}
        store.put(snapshot,'main');
        if (reportsChanged) store.put(next,'reportRevision');
      };
      tx.oncomplete = () => {reportRevision=next;resolve();};
      tx.onabort = () => reject(conflict ? stale : tx.error || new Error('Penyimpanan dibatalkan.'));
    });
  }
  function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5200);}
  function persist(reportsChanged=false){const snapshot=C.clone(state);saveQueue=saveQueue.catch(()=>{}).then(()=>writeState(snapshot,reportsChanged));saveQueue.then(()=>{if($('#save-state'))$('#save-state').innerHTML='<span class="saved-dot"></span>Draf tersimpan di perangkat ini';}).catch(err=>{if(err.name==='StaleHistory'){openModal('Riwayat telah diperbarui','<p>'+e(err.message)+'</p>',btn('Muat ulang','reload-history','','primary'));}else notify('Penyimpanan belum berhasil. Ekspor cadangan sebelum menutup halaman.');});return saveQueue;}
  try{db=await initDB();state=await readState()||fresh();}catch{fallback=true;try{state=JSON.parse(localStorage.getItem('dc-inspect-fallback-v1'))||fresh();}catch{state=fresh();}}
  reportRevision=state.reportRevision || '';
  function upgradeCatalog(s){
    if(s.catalogVersion===D.version && s.dailyParameterVersion===D.dailyParameterVersion)return {changed:false};
    s.catalogVersion=D.version;
    if(s.dailyParameterVersion===D.dailyParameterVersion){
      const defaults=new Map(D.rules.map(rule=>[rule.id,rule]));
      for(const rule of s.rules){
        const standard=defaults.get(rule.id);
        if(standard && rule.source===standard.source)rule.title=standard.title;
      }
      return {changed:false};
    }
    const retained=s.rules.filter(r=>r.id.startsWith('rule-')||r.source==='Penyesuaian lokal');
    s.rules=[...C.clone(D.rules),...retained.filter(r=>!D.rules.some(t=>t.id===r.id))];s.dailyParameterVersion=D.dailyParameterVersion;
    return {changed:true};
  }
  const dailyUpdate=upgradeCatalog(state);
  C.addDemoAssets(state,D);C.updateDemoAssetNames(state,D);
  // One-time cleanup of the two identifiable simulation sessions in the prototype.
  if(!state.webDemoCleaned){
    const demo=s=>s.site==='Pusat Data Demo'&&s.date==='2026-11-04'&&['Pengujian prototipe','Uji checklist harian'].includes(s.inspector)&&s.rows.every(r=>r.assetCode.startsWith('DEMO-'));
    state.reports=state.reports.filter(s=>!demo(s));state.drafts=state.drafts.filter(s=>!demo(s));state.webDemoCleaned=true;
  }
  const current=()=>state.drafts.find(d=>d.id===ui.draftId);
  const report=()=>state.reports.find(r=>r.id===ui.reportId);
  const btn=(label,action,extra='',style='')=>`<button type="button" class="btn ${style}" data-action="${action}" ${extra}>${label}</button>`;
  const badge=(text,style='')=>`<span class="badge ${style}">${e(text)}</span>`;
  const stat=(label,value,sub,ic='box')=>`<div class="stat"><div class="stat-label">${e(label)}${icon(ic)}</div><strong>${e(value)}</strong><small>${e(sub)}</small></div>`;
  const empty=(title,description,ic='file')=>`<div class="empty">${icon(ic)}<strong>${e(title)}</strong><p>${e(description)}</p></div>`;
  const options=(items,value)=>items.map(([v,label])=>`<option value="${e(v)}" ${v===value?'selected':''}>${e(label)}</option>`).join('');
  const categoryOptions=value=>options([['all','Semua kategori'],...D.categories.map(c=>[c.id,c.name])],value);
  const periodOptions=value=>options(Object.entries(D.periods),value);
  function field(label,name,value='',type='text',extra=''){return `<div class="field"><label for="${e(name)}">${e(label)}</label><input id="${e(name)}" name="${e(name)}" type="${type}" value="${e(value)}" ${extra}></div>`;}
  function shell(){const nav=[['dashboard','grid','Ringkasan'],['inspect','list','Pemeriksaan'],['assets','box','Daftar aset'],['rules','book','Bank checklist'],['reports','file','Laporan & riwayat']];const names=Object.fromEntries(nav.map(n=>[n[0],n[2]]));
    $('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">${icon('list')}</span><span class="brand-text">DC Inspect<small>Facility workspace</small></span></div><div class="nav-label">RUANG KERJA</div><nav>${nav.map(([id,ic,title])=>`<button class="nav-btn ${ui.view===id?'active':''}" data-nav="${id}" title="${title}" aria-label="${title}">${icon(ic)}<span>${title}</span></button>`).join('')}</nav></aside><div class="main-shell"><header class="topbar"><div class="breadcrumb">${icon('box')}<strong>${e(state.site)}</strong><span>/</span><span>${names[ui.view]||'Laporan'}</span></div><div class="top-actions">${badge('Prototipe · aset contoh','orange')}${badge('Tersimpan di browser ini','outline')}<div class="avatar">DC</div></div></header><main class="content" id="main"></main></div></div>`;
    const views={dashboard:renderDashboard,inspect:renderInspect,assets:renderAssets,rules:renderRules,reports:renderHistory,report:renderReport};
    (views[ui.view]||renderDashboard)();
  }
  function navigate(view){ui.view=view;if(view==='inspect'&&!current()&&state.drafts.length){ui.draftId=state.drafts[0].id;ui.expanded=new Set();}shell();window.scrollTo({top:0,behavior:'instant'});}
  function pageHead(kicker,title,description,actions=''){return `<div class="page-head"><div><p class="eyebrow" style="margin-bottom:10px">${e(kicker)}</p><h1>${e(title)}</h1><p>${e(description)}</p></div>${actions}</div>`;}
  function renderDashboard(){const active=state.assets.filter(a=>a.active),findings=state.reports.reduce((n,r)=>n+C.metrics(r.rows).fail,0);const descriptions={daily:'Pemeriksaan rutin kondisi aset sebelum temuan terlewat.',monthly:'Inspeksi berkala dan verifikasi fungsi sesuai jadwal.',yearly:'Tinjauan menyeluruh dan hasil pemeliharaan teknis.'};
    $('#main').innerHTML=pageHead('Pemeriksaan fasilitas','Pemeriksaan pusat data','Kelola pemeriksaan berkala dan susun laporan dari hasil pengecekan di lapangan.',btn(icon('plus')+' Pemeriksaan baru','new','','primary'))+
    `<div class="stats">${stat('Aset aktif',active.length,'Unit dan area dalam daftar','box')}${stat('Kategori fasilitas',new Set(active.map(a=>a.category)).size,'Dikelompokkan sesuai jenis aset','grid')}${stat('Laporan final',state.reports.length,'Hasil pemeriksaan yang diselesaikan','file')}${stat('Temuan tercatat',findings,'Akumulasi pada laporan final','alert')}</div>`+
    periodCards()+
    `<div class="grid-two"><section class="panel" id="draft-list"><div class="panel-head"><h2>Draf pemeriksaan</h2>${badge(`${state.drafts.length} draf`)}</div>${state.drafts.length?'<p class="caption hold-hint draft-hint">Tekan dan tahan draf untuk menghapusnya.</p>':''}${state.drafts.length?state.drafts.map(d=>{const m=C.metrics(d.rows);return `<div class="list-row draft-row" data-hold-id="${e(d.id)}"><div><strong>${D.periods[d.period]} · ${fmt(d.date)}</strong><small>${e(d.inspector||'Petugas belum diisi')} · ${m.answered}/${m.total} butir terisi</small></div><div class="button-row">${btn('Lanjutkan','resume',`data-id="${e(d.id)}"`,'compact soft')}${btn('Hapus','delete-draft',`data-id="${e(d.id)}"`,'compact danger')}</div></div>`;}).join(''):empty('Belum ada draf','Mulai pemeriksaan untuk menyimpan progres Anda.','list')}</section><section class="panel"><div class="panel-head"><h2>Cakupan aset</h2>${btn('Lihat semua','nav-assets','','ghost compact')}</div>${['cctv','ups','power','hvac'].map(id=>{const n=active.filter(a=>a.category===id).length;return `<div class="category-mini"><div class="mini-icon">${icon(id==='cctv'?'camera':'box')}</div><div class="mini-text"><strong>${cat(id).name}</strong><span>${n} aset terdaftar</span></div>${badge(`${state.rules.filter(r=>r.category===id).length} butir`)}</div>`;}).join('')}<p class="caption" style="margin:4px 0 0">Daftar awal memakai aset simulasi. Ganti dengan inventaris Anda pada menu Daftar aset.</p></section></div>`;
    if (state.drafts.length) enableHoldRemoval($('#draft-list'), confirmDraftRemoval);
  }
  function renderInspect(){const s=current();if(!s){$('#main').innerHTML=pageHead('FORM PEMERIKSAAN','Pilih jadwal pemeriksaan.','Form disusun otomatis untuk aset yang Anda pilih.',btn(icon('plus')+' Pemeriksaan baru','new','','primary'))+empty('Belum ada pemeriksaan aktif','Mulai dari pemeriksaan harian, bulanan, atau tahunan.','list');return;}
    const completed=C.completedInspection(state.reports,s);
    if(completed){$('#main').innerHTML=completionNotice(completed)+btn('Kembali ke ringkasan','nav-dashboard');return;}
    const m=C.metrics(s.rows);const rowFilter=r=>(ui.category==='all'||r.category===ui.category)&&(!ui.query||label(`${r.title} ${r.assetCode} ${r.assetName}`).toLowerCase().includes(ui.query.toLowerCase()));const rows=C.groupByCategory(s.rows.filter(rowFilter)).flatMap(group=>group.rows);const ids=[...new Set(rows.map(r=>r.assetId))];if(!ui.expanded.size&&ids.length)ui.expanded.add(ids[0]);
    $('#main').innerHTML=pageHead('FORM '+D.periods[s.period].toUpperCase(),`Pemeriksaan ${D.periods[s.period].toLowerCase()}`,simpleForm ? 'Ketuk hasil untuk memilih. Ketuk pilihan yang sama lagi untuk membatalkan.' : 'Isi hasil untuk setiap butir. Temuan, N/A, dan penundaan memerlukan catatan.',`<div class="button-row">${badge('Draf','orange')}${btn(icon('plus')+' Sesi baru','new','','compact')}</div>`)+
      `${s.period==='daily'&&s.dailyParameterVersion!==state.dailyParameterVersion?`<div class="notice orange">Draf ini memakai checklist harian sebelumnya. Isian tetap disimpan. Buat sesi baru untuk menggunakan 41 parameter harian terbaru. ${btn('Buat sesi terbaru','new','data-period="daily"','compact')}</div>`:''}<details class="panel session-details" ${!s.inspector||!matchMedia('(max-width:650px)').matches?'open':''}><summary>Detail pemeriksaan · ${e(s.inspector||'Isi nama petugas')}</summary><div class="fields four"><div class="field"><label for="meta-site">Lokasi pusat data *</label><input id="meta-site" data-meta="site" value="${e(s.site)}"></div><div class="field"><label for="meta-inspector">Nama petugas *</label><input id="meta-inspector" data-meta="inspector" value="${e(s.inspector)}" placeholder="Nama pemeriksa"></div><div class="field"><label for="meta-date">Tanggal pemeriksaan *</label><input id="meta-date" data-meta="date" type="date" value="${e(s.date)}"></div><div class="field"><label for="meta-shift">Sif / kelompok kerja</label><select id="meta-shift" data-meta="shift">${options([['Umum','Umum'],['Pagi','Pagi'],['Siang','Siang'],['Malam','Malam']],s.shift)}</select></div></div></details>` + (simpleForm ? window.DCPhone.form(s, ui.focusIssue, photoField) :
      `<div class="inspection-summary"><div class="overall"><strong>${m.completion}%</strong><div class="small muted">pengisian form</div></div><div class="progress" aria-label="${m.completion}% terisi"><span style="width:${m.completion}%"></span></div><div class="status-totals"><span><strong>${m.pass}</strong>Sesuai</span><span><strong>${m.fail}</strong>Temuan</span><span><strong>${m.na}</strong>N/A</span><span><strong>${m.deferred}</strong>Tertunda</span><span><strong>${m.pending}</strong>Belum diisi</span></div></div>`+
      `<div class="notice">${icon('book')} Butir bertanda teknisi/vendor diisi dari pekerjaan atau laporan personel yang berwenang.</div>`+
      `<div class="toolbar"><div class="search">${icon('search')}<input class="input" id="inspection-search" placeholder="Cari aset atau butir pemeriksaan…" value="${e(ui.query)}"></div><select class="input" id="inspection-category" aria-label="Filter kategori">${categoryOptions(ui.category)}</select><span class="small muted">${rows.length} butir ditampilkan</span></div>`+
      `<div id="checklist">${ids.length?C.groupByCategory(rows).map(category=>`<section class="inspection-category" aria-labelledby="category-${e(category.id)}"><header class="category-heading"><h2 id="category-${e(category.id)}">${e(label(category.name))}</h2><p>${C.groupByAsset(category.rows).length} aset · ${category.rows.length} parameter</p></header>${[...new Set(category.rows.map(row=>row.assetId))].map(id=>{const all=s.rows.filter(r=>r.assetId===id),filtered=rows.filter(r=>r.assetId===id),a=all[0],cm=C.metrics(all);return `<details class="asset-group" data-asset-id="${e(id)}" ${ui.expanded.has(id)?'open':''}><summary><span class="mini-icon">${icon(a.category==='cctv'?'camera':'box')}</span><span class="summary-main"><h3>${e(label(a.assetName))}</h3><span>${e(a.assetCode)} · ${e(a.location)} · ${cat(a.category).name}</span></span><span class="group-count">${cm.answered}/${cm.total} terisi</span>${cm.fail?badge(`${cm.fail} temuan`,'red'):''}</summary>${filtered.map((r,i)=>checkCard(r,i+1)).join('')}</details>`;}).join('')}</section>`).join(''):'<div class="checklist-no-results">Tidak ada butir yang cocok dengan pencarian.</div>'}</div>`+
      `${ui.validationActive?`<div class="notice orange" role="status">Lengkapi butir yang disorot sebelum membuat laporan. ${btn('Ke isian belum lengkap berikutnya','next-incomplete','','compact')}</div>`:''}<div class="sticky-actions"><p id="save-state"><span class="saved-dot"></span>Draf tersimpan di perangkat ini</p><div class="button-row">${btn(icon('eye')+' Pratinjau laporan','preview')}${btn('Selesaikan & buat laporan '+icon('arrow'),'finalize','','primary')}</div></div>`);
  }
  function photoField(row) {
    const id = e(row.id);
    const photos = row.evidence || [];
    if (row.status !== 'fail' && !photos.length) return '';
    return `<div class="photo-field">
      <strong>Foto bukti${photos.length ? '' : ' (opsional)'}</strong>
      ${photos.map(photo => `<img src="${e(photo.data)}" alt="Foto bukti untuk ${e(label(row.title))}">`).join('')}
      ${row.status === 'fail' ? `<div class="photo-choices">
        <label>Ambil foto<input type="file" accept="image/*" capture="environment" data-photo="${id}"></label>
        <label>Pilih dari galeri<input type="file" accept="image/*" data-photo="${id}"></label>
      </div>${photos.length ? '<small>Foto baru akan menggantikan foto sebelumnya.</small>' : ''}` : ''}
      ${photos.length ? `<button type="button" class="btn photo-remove" data-action="remove-photo" data-id="${id}">Hapus foto</button>` : ''}
    </div>`;
  }

  function checkCard(r,index){return `<article class="check-card is-${e(r.status)} ${ui.focusIssue?.rowId===r.id?'needs-attention':''}" data-row="${e(r.id)}">${ui.focusIssue?.rowId===r.id?`<p class="validation-hint" role="alert">${e(ui.focusIssue.message)}</p>`:''}<div class="check-top"><span class="check-num">${String(index).padStart(2,'0')}</span><div class="check-title"><h4>${e(label(r.title))}</h4><div class="check-tags">${r.role.startsWith('Teknisi')?badge('Teknisi / vendor','outline'):''}</div></div></div><div class="check-criterion"><strong>Kriteria:</strong> ${e(r.criterion)}</div><div class="status-buttons">${[['pass','check','Sesuai'],['fail','alert','Temuan'],['na','dash','N/A'],['deferred','pause','Tertunda']].map(([v,ic,label])=>`<button type="button" class="status-btn ${r.status===v?'selected '+v:''}" data-action="status" data-id="${e(r.id)}" data-status="${v}" aria-pressed="${r.status===v}">${icon(ic)}${label}</button>`).join('')}</div><div class="check-fields"><div class="fields two"><div class="field"><label for="reading-${e(r.id)}">${r.measurement?'Nilai / rujukan hasil ukur *':'Nilai / hasil ukur (jika relevan)'}</label><input id="reading-${e(r.id)}" data-row-field="reading" data-id="${e(r.id)}" value="${e(r.reading)}" placeholder="Contoh: hasil pengukuran dan satuannya"></div><div class="field"><label for="note-${e(r.id)}">${r.status==='fail'?'Uraian temuan *':['na','deferred'].includes(r.status)?'Alasan *':'Catatan pemeriksaan'}</label><input id="note-${e(r.id)}" data-row-field="note" data-id="${e(r.id)}" value="${e(r.note)}" placeholder="${r.status==='na'?'Mengapa butir ini tidak berlaku?':r.status==='deferred'?'Alasan dan rencana pemeriksaan berikutnya':'Kondisi atau referensi laporan teknisi'}"></div></div>${r.status==='fail'?`<div class="fields" style="margin-top:12px"><div class="field"><label for="priority-${e(r.id)}">Prioritas temuan</label><select id="priority-${e(r.id)}" data-row-field="priority" data-id="${e(r.id)}">${options(['Rendah','Sedang','Tinggi','Kritis'].map(v=>[v,v]),r.priority)}</select></div><div class="field"><label for="pic-${e(r.id)}">PIC tindak lanjut</label><input id="pic-${e(r.id)}" data-row-field="pic" data-id="${e(r.id)}" value="${e(r.pic)}" placeholder="Dapat ditetapkan kemudian"></div><div class="field"><label for="target-${e(r.id)}">Target tindak lanjut</label><input type="date" id="target-${e(r.id)}" data-row-field="target" data-id="${e(r.id)}" value="${e(r.target)}"></div></div>`:''}<div id="photo-${e(r.id)}">${photoField(r)}</div><div class="evidence-line"><span>${r.checkedAt?'Dicatat '+time(r.checkedAt):'Belum ada hasil dicatat'}</span></div></div></article>`;}
  function renderAssets(){const list=state.assets.filter(a=>(ui.assetCategory==='all'||a.category===ui.assetCategory)&&label(`${a.code} ${a.name} ${a.location}`).toLowerCase().includes(ui.assetQuery.toLowerCase()));
    $('#main').innerHTML=pageHead('INVENTARIS','Daftar aset fasilitas','Setiap unit atau area memiliki identitas sendiri. Checklist disusun berdasarkan kategori dan jenis perangkat.',btn(icon('plus')+' Tambah aset','asset-add','','primary'))+
    `<div class="notice">Aset dengan kode DEMO adalah contoh. Anda dapat menggantinya, menonaktifkan aset yang tidak tersedia, atau menambah setiap unit nyata. Perubahan inventaris berlaku pada sesi baru; laporan dan draf lama menyimpan identitas aset saat pemeriksaan dibuat.</div><div class="toolbar"><div class="search">${icon('search')}<input class="input" id="asset-search" value="${e(ui.assetQuery)}" placeholder="Cari kode, nama, atau lokasi aset…"></div><select class="input" id="asset-category" aria-label="Filter kategori aset">${categoryOptions(ui.assetCategory)}</select></div><div class="panel"><div class="table-wrap"><table><thead><tr><th>Aset</th><th>Kategori / jenis</th><th>Lokasi</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${list.map(a=>`<tr><td><strong>${e(label(a.name))}</strong><small>${e(a.code)}</small></td><td>${e(cat(a.category).name)}<small>${e(D.subtypes[a.subtype]||a.subtype)}</small></td><td>${e(a.location||'—')}<small>${e(a.manufacturer||'')} ${e(a.model||'')}</small></td><td>${badge(a.active?'Aktif':'Nonaktif',a.active?'green':'')}</td><td><div class="table-actions">${btn(icon('edit')+' Ubah','asset-edit',`data-id="${e(a.id)}"`,'compact')}${btn(a.active?'Nonaktifkan':'Aktifkan','asset-toggle',`data-id="${e(a.id)}"`,'ghost compact')}</div></td></tr>`).join('')}</tbody></table>${!list.length?empty('Aset tidak ditemukan','Ubah pencarian atau tambahkan aset baru.'):''}</div></div>`;
  }
  function renderRules(){const filtered=state.rules.filter(r=>(ui.ruleCategory==='all'||r.category===ui.ruleCategory)&&(ui.rulePeriod==='all'||r.period===ui.rulePeriod)&&label(r.title).toLowerCase().includes(ui.ruleQuery.toLowerCase()));
    $('#main').innerHTML=pageHead('KERANGKA CHECKLIST','Bank butir pemeriksaan','Kelola butir, frekuensi, metode, dan kriteria penerimaan. Setiap sesi menyimpan versi butir yang digunakannya.',btn(icon('plus')+' Tambah butir','rule-add','','primary'))+
    `<div class="toolbar"><div class="search">${icon('search')}<input class="input" id="rule-search" value="${e(ui.ruleQuery)}" placeholder="Cari butir pemeriksaan…"></div><select class="input" id="rule-category" aria-label="Kategori butir">${categoryOptions(ui.ruleCategory)}</select><select class="input" id="rule-period" aria-label="Periode butir">${options([['all','Semua periode'],...Object.entries(D.periods)],ui.rulePeriod)}</select></div><div class="panel"><div class="panel-head"><h2>${filtered.length} butir dalam bank</h2>${badge('Versi awal · perlu validasi','orange')}</div>${filtered.map(r=>`<div class="library-card"><div class="mini-icon">${icon('list')}</div><div class="library-main"><h3>${e(label(r.title))}</h3><div class="check-tags">${badge(cat(r.category).name)}${badge(D.periods[r.period],'green')}</div><p>Kriteria: ${e(r.criterion)}</p><span class="small muted">${e(r.method)} · ${e(r.role)}</span></div>${btn(icon('edit'),'rule-edit',`data-id="${e(r.id)}" aria-label="Ubah butir"`,'compact')}</div>`).join('')||empty('Tidak ada butir yang cocok','Ubah filter untuk menampilkan butir lainnya.')}</div>`;
  }
  function renderHistory() {
    const query = ui.historyQuery.trim().toLowerCase();
    const draftIds = new Set(state.drafts.map(draft => draft.id));
    const filtered = [...state.reports, ...state.drafts].reverse().filter(session => {
      const matchesDate = !ui.historyDate || session.date === ui.historyDate;
      const matchesPeriod = ui.historyPeriod === 'all' || session.period === ui.historyPeriod;
      const searchable = [session.number, session.inspector, session.site, D.periods[session.period]].join(' ').toLowerCase();
      return matchesDate && matchesPeriod && searchable.includes(query);
    }).sort((a, b) => b.date.localeCompare(a.date));
    const days = new Map();
    for (const session of filtered) {
      if (!days.has(session.date)) days.set(session.date, []);
      days.get(session.date).push(session);
    }
    const sections = [...days].map(([date, sessions]) =>
      `<section class="history-day"><h2>${e(fmt(date))}</h2>
        ${sessions.map(session => {
          const m = C.metrics(session.rows), id = e(session.id), draft = draftIds.has(session.id);
          const status = draft ? 'Draf' : m.deferred ? 'Final · ada penundaan' : 'Final';
          const progress = draft ? `${m.answered}/${m.total} butir terisi` :
            `${m.inspected}/${m.applicable} butir diperiksa${m.na ? ' · '+m.na+' N/A' : ''}${m.deferred ? ' · '+m.deferred+' tertunda' : ''}`;
          return `<article class="history-report" data-hold-id="${id}">
            <div><strong>${e(draft ? 'Pemeriksaan ' + D.periods[session.period].toLowerCase() : session.number)}</strong>
              <p>${e([draft ? '' : D.periods[session.period], session.inspector || 'Petugas belum diisi', session.site].filter(Boolean).join(' · '))}</p>
              <p>${progress}</p>
              ${badge(status, draft || m.deferred ? 'orange' : 'green')}
              ${!draft || m.fail ? badge(m.fail+' tidak sesuai',m.fail?'red':'green') : ''}</div>
            <div class="button-row">${btn(draft?'Lanjutkan':'Buka',draft?'resume':'open-report',`data-id="${id}"`,'compact')}
              ${btn('Hapus',draft?'delete-draft':'delete-report',`data-id="${id}"`,'compact danger')}</div>
          </article>`;
        }).join('')}</section>`
    ).join('');
    const hasFilters = Boolean(query || ui.historyDate || ui.historyPeriod !== 'all');
    $('#main').innerHTML = pageHead('ARSIP PEMERIKSAAN','Laporan & riwayat','Draf dan laporan final diurutkan berdasarkan tanggal pemeriksaan.',
      `<div class="button-row">${!hasFilters && state.reports.length ? btn('Hapus semua laporan final','delete-all','','danger') : ''}${btn(icon('download')+' Cadangkan data','backup')}${btn(icon('upload')+' Pulihkan data','restore')}</div>`) +
      `<div class="toolbar history-toolbar"><div class="search">${icon('search')}<input class="input" id="history-search" value="${e(ui.historyQuery)}" placeholder="Cari nomor laporan, petugas, atau lokasi…"></div>
      <label class="field" for="history-date">Tanggal pemeriksaan<input class="input" type="date" id="history-date" value="${e(ui.historyDate)}"></label>
      <label class="field" for="history-period">Periode<select class="input" id="history-period">${options([['all','Semua periode'],...Object.entries(D.periods)],ui.historyPeriod)}</select></label>
      ${hasFilters ? btn('Reset filter','reset-history','','compact') : ''}</div>
      ${filtered.length ? `<p class="caption hold-hint">Tekan dan tahan pemeriksaan untuk membuka pilihan hapus.</p><div id="history-list">${sections}</div>` :
        hasFilters ? empty('Tidak ada pemeriksaan yang cocok','Periksa filter atau buka kembali browser dan perangkat yang digunakan saat mengisi formulir.','file') :
        empty('Belum ada pemeriksaan di browser ini','Draf dan laporan tersimpan di browser yang digunakan saat pemeriksaan.','file')}
      <p class="caption">Riwayat tersimpan pada browser dan perangkat ini.</p>`;
    if (filtered.length) enableHoldRemoval($('#history-list'), id => draftIds.has(id) ? confirmDraftRemoval(id) : confirmReportRemoval(id));
  }

  function confirmDraftRemoval(id) {
    const draft = state.drafts.find(item => item.id === id);
    if (!draft) return;
    const progress = C.metrics(draft.rows);
    openModal('Hapus draf pemeriksaan?',
      '<p><strong>' + e(D.periods[draft.period]) + ' · ' + e(fmt(draft.date)) + '</strong><br>' +
      e(draft.site) + ' · ' + e(draft.inspector || 'Petugas belum diisi') + '</p><p class="caption">' +
      progress.answered + '/' + progress.total + ' butir terisi. Isian dan foto pada draf ini akan dihapus.</p>',
      '<div class="modal-footer">' + btn('Batal','close-modal','data-initial-focus') +
      btn('Ya, hapus draf','confirm-delete-draft','data-id="' + e(id) + '"','danger') + '</div>');
  }

  function confirmReportRemoval(id) {
    const all = id === '*';
    const report = state.reports.find(item => item.id === id);
    if (!all && !report) return;
    const scope = all ? 'semua laporan final di perangkat ini' : `laporan <strong>${e(report.number)}</strong> tanggal ${e(fmt(report.date))}`;
    openModal('Hapus riwayat pemeriksaan?', `<p>Hapus ${scope}?</p>`,
      `<div class="modal-footer">${btn('Batal','close-modal')}${btn('Hapus','confirm-delete',`data-id="${e(id)}"`,'danger')}</div>`);
  }

  function enableHoldRemoval(list, confirmRemoval) {
    let press;
    function cancel() {
      if (!press) return;
      clearTimeout(press.timer);
      press.row.classList.remove('hold-ready');
      press = null;
    }
    list.addEventListener('pointerdown', event => {
      cancel();
      const row = event.target.closest('[data-hold-id]');
      if (!row || event.target.closest('button') || !event.isPrimary || event.button !== 0) return;
      press = {row, pointer:event.pointerId, x:event.clientX, y:event.clientY};
      row.setPointerCapture(event.pointerId);
      press.timer = setTimeout(() => row.classList.add('hold-ready'), 600);
    });
    list.addEventListener('pointermove', event => {
      if (press?.pointer === event.pointerId && Math.hypot(event.clientX-press.x, event.clientY-press.y) > 10) cancel();
    });
    list.addEventListener('pointercancel', cancel);
    list.addEventListener('lostpointercapture', cancel);
    list.addEventListener('pointerup', event => {
      if (press?.pointer !== event.pointerId) return;
      const row = press.row, ready = row.classList.contains('hold-ready');
      cancel();
      if (ready) confirmRemoval(row.dataset.holdId);
    });
    list.addEventListener('contextmenu', event => {
      if (press && press.row.contains(event.target)) event.preventDefault();
    });
  }
  const reportHTML=session=>window.DCIReport.html(session);
  function renderReport(){const s=ui.reportId?report():current();if(!s){navigate('reports');return;}$('#main').innerHTML='<div class="report-page-head">'+pageHead(s.finalizedAt?'HASIL PEMERIKSAAN':'PRATINJAU DRAF',s.finalizedAt?'Laporan siap ditinjau.':'Pratinjau laporan pemeriksaan','Unduh laporan Excel dengan tabel berformat dan foto bukti yang disertakan.',`<div class="button-row">${btn(icon('arrow')+' Kembali',s.finalizedAt?'nav-reports':'nav-inspect')}${btn(icon('download')+' Unduh laporan (.xlsx)','excel','','primary')}${btn(icon('print')+' Cetak / Simpan PDF','print','','primary')}</div>`)+'</div>'+reportHTML(s);}
  function openModal(title,body,footer='',wide=false){$('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide-modal':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${e(title)}</h2><button class="close" data-action="close-modal" aria-label="Tutup">×</button></div>${body}${footer}</section></div>`;setTimeout(()=>($('#modal-root [data-initial-focus]') || $('#modal-root input, #modal-root select, #modal-root button'))?.focus(),20);}
  function closeModal(){$('#modal-root').innerHTML='';}
  function scheduledAssets(period) {
    const rows=C.rowsFor(state.assets,state.rules,period);
    const units=new Map();
    for(const row of rows){
      if(!units.has(row.assetId))units.set(row.assetId,{name:row.assetName,code:row.assetCode,category:row.category,count:0});
      units.get(row.assetId).count++;
    }
    const groups=D.categories.map(category=>({name:category.name,units:[...units.values()].filter(unit=>unit.category===category.id)})).filter(group=>group.units.length);
    return {rows,groups,count:units.size};
  }
  function roster(schedule){
    return schedule.groups.map(group=>'<details class="period-group"><summary>'+e(label(group.name))+' · '+group.units.length+' aset</summary><ul>'+group.units.map(unit=>'<li>'+e(label(unit.name))+' · '+e(unit.code)+' · '+unit.count+' butir</li>').join('')+'</ul></details>').join('');
  }
  function periodCards(){
    return '<div class="section-head"><h2>Jadwal pemeriksaan</h2></div><div class="period-cards">'+Object.entries(D.periods).map(([key,label])=>{
      const schedule=scheduledAssets(key);
      return '<section class="period-card"><h3>'+e(label)+'</h3><div class="caption">'+schedule.count+' aset aktif · '+schedule.rows.length+' butir</div><details class="schedule-assets"><summary>Lihat aset</summary><div class="period-roster">'+roster(schedule)+'</div></details>'+btn('Mulai '+label.toLowerCase(),'new','data-period="'+e(key)+'" '+(schedule.count?'':'disabled'),'primary')+'</section>';
    }).join('')+'</div>';
  }
  function completionNotice(report) {
    const date = new Intl.DateTimeFormat('id-ID', {day:'numeric', month:'long', year:'numeric'}).format(new Date(report.date+'T12:00:00'));
    return `<div class="notice" role="status"><strong>Pemeriksaan sudah selesai</strong>
      <p>Anda sudah melakukan pemeriksaan ${e(D.periods[report.period].toLowerCase())} pada tanggal ${e(date)} di ${e(report.site)}.</p>
      ${btn('Buka laporan','open-report',`data-id="${e(report.id)}"`,'soft')}</div>`;
  }
  function updateStartAvailability() {
    const form = $('#new-session');
    const record = C.completedInspection(state.reports, Object.fromEntries(new FormData(form)));
    $('#completed-check').innerHTML = record ? completionNotice(record) : '';
    form.querySelector('[type="submit"]').disabled = !!record || !form.querySelector('#period-roster li');
  }
  function renderSchedule(period){
    const schedule=scheduledAssets(period);
    $('#period-roster').innerHTML=roster(schedule);
    $('#pick-count').textContent=schedule.count+' aset · '+schedule.rows.length+' butir';
    updateStartAvailability();
  }
  function newModal(period='daily'){openModal('Mulai pemeriksaan',`<form id="new-session"><div id="form-errors"></div><div class="fields two"><div class="field"><label for="new-period">Jenis pemeriksaan</label><select id="new-period" name="period">${periodOptions(period)}</select></div>${field('Tanggal','date',C.localDate(),'date','required')}${field('Nama petugas','inspector','','text','placeholder="Nama dapat dilengkapi saat pemeriksaan"')}${field('Pusat data','site',state.site,'text','required')}</div><div id="completed-check"></div><h3 class="schedule-heading">Aset dalam jadwal</h3><p class="field-help">Seluruh unit aktif di bawah ini otomatis masuk ke sesi pemeriksaan.</p><div id="period-roster"></div><div class="modal-footer"><span id="pick-count" role="status"></span>${btn('Batal','close-modal')}<button class="btn primary" type="submit">Buka checklist ${icon('arrow')}</button></div></form>`,'',true);renderSchedule(period);}

  function assetModal(id){const a=id?state.assets.find(a=>a.id===id):{id:'',code:'',name:'',category:'cctv',subtype:'camera',location:'',manufacturer:'',model:'',responsible:''};openModal(id?'Ubah aset':'Tambah aset',`<form id="asset-form" data-id="${e(a.id)}"><div id="form-errors"></div><div class="fields two">${field('Kode aset *','code',a.code,'text','required')}${field('Nama aset *','name',label(a.name),'text','required')}<div class="field"><label for="asset-form-category">Kategori</label><select id="asset-form-category" name="category">${options(D.categories.map(c=>[c.id,c.name]),a.category)}</select></div><div class="field"><label for="subtype">Jenis unit</label><select id="subtype" name="subtype">${subtypeOptions(a.category,a.subtype)}</select></div>${field('Lokasi aset *','location',a.location,'text','required')}${field('Penanggung jawab','responsible',a.responsible)}${field('Pabrikan','manufacturer',a.manufacturer)}${field('Model','model',a.model)}</div><p class="field-help">Kategori CCTV membedakan kamera, perekam, dan monitor agar butir sesuai perangkat. Pilih Sistem / area lengkap untuk aset yang merepresentasikan satu sistem.</p><div class="modal-footer">${btn('Batal','close-modal')}<button type="submit" class="btn primary">Simpan aset</button></div></form>`);}
  function subtypeOptions(category,value){const allowed=category==='cctv'?['camera','recorder','monitor','system']:category==='power'?['system','ats','pdu','switchgear']:['system'];return options(allowed.map(v=>[v,D.subtypes[v]]),allowed.includes(value)?value:allowed[0]);}
  function ruleModal(id){const r=id?state.rules.find(r=>r.id===id):{id:'',title:'',category:'cctv',period:'daily',criterion:'',method:'Visual / verifikasi',role:'Petugas inspeksi',source:'Usulan operasional',sourceUrl:'',originalPeriod:'Tambahan lokal',measurement:false};openModal(id?'Sesuaikan butir':'Tambah butir lokal',`<form id="rule-form" data-id="${e(r.id)}"><div id="form-errors"></div><div class="fields two"><div class="field wide"><label for="rule-title">Butir pemeriksaan *</label><textarea id="rule-title" name="title" required>${e(label(r.title))}</textarea></div><div class="field"><label for="rule-cat">Kategori</label><select id="rule-cat" name="category">${options(D.categories.map(c=>[c.id,c.name]),r.category)}</select></div><div class="field"><label for="rule-p">Jadwal diterapkan</label><select id="rule-p" name="period">${periodOptions(r.period)}</select></div><div class="field wide"><label for="criterion">Kriteria penerimaan / rujukan SOP *</label><textarea id="criterion" name="criterion" placeholder="Tentukan kondisi diterima, batas ukur, satuan, dan nomor SOP/OEM." required>${e(r.criterion)}</textarea></div>${field('Metode pemeriksaan','method',r.method)}<div class="field"><label for="role">Pelaksana</label><select id="role" name="role">${options([['Petugas inspeksi','Petugas inspeksi'],['Teknisi / vendor kompeten','Teknisi / vendor kompeten']],r.role)}</select></div><div class="field wide"><label><input type="checkbox" name="measurement" ${r.measurement?'checked':''}> Hasil ukur / rujukan pengukuran wajib saat dinyatakan sesuai</label></div></div><p class="field-help">Perubahan berlaku untuk sesi baru.</p><div class="modal-footer">${btn('Batal','close-modal')}<button class="btn primary" type="submit">Simpan butir</button></div></form>`);}
  function errors(messages){$('#form-errors').innerHTML=`<div class="errors"><ul>${messages.map(m=>`<li>${e(m)}</li>`).join('')}</ul></div>`;}
  function goToIncomplete(){
    const session=current();if(!session)return;
    const pending=C.incompleteFields(session, simpleForm),issue=pending[0];
    if(!issue){ui.validationActive=false;ui.focusIssue=null;renderInspect();notify('Semua isian sudah lengkap. Anda dapat membuat laporan.');return;}
    closeModal();clearTimeout(searchTimers.query);rememberOpen();ui.query='';ui.category='all';ui.focusIssue=issue;
    if(issue.assetId)ui.expanded.add(issue.assetId);
    renderInspect();
    const card=issue.rowId?[...document.querySelectorAll('[data-row]')].find(el=>el.dataset.row===issue.rowId):null;
    const target=card?(issue.field==='status'?card.querySelector('[data-action="status"]'):card.querySelector('[data-row-field="'+issue.field+'"]')):document.querySelector('[data-meta="'+issue.field+'"]');
    if(target?.closest('.session-details'))target.closest('.session-details').open=true;const anchor=card||target;if(anchor){anchor.scrollIntoView({behavior:'instant',block:'center'});target?.scrollIntoView({behavior:'instant',block:'center'});target?.focus({preventScroll:true});}
    notify(pending.length+' isian belum lengkap. '+issue.message);
  }
  function rememberOpen(){ui.expanded=new Set([...document.querySelectorAll('.asset-group[open]')].map(el=>el.dataset.assetId));}
  function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function selectedReport(){return ui.reportId?report():current();}
  function saveInput(el){const s=current();if(el.dataset.meta&&s){s[el.dataset.meta]=el.value;persist();}if(el.dataset.rowField&&s){const row=s.rows.find(r=>r.id===el.dataset.id);if(row){row[el.dataset.rowField]=el.value;if(ui.focusIssue?.rowId===row.id && ui.focusIssue.field===el.dataset.rowField && el.value.trim()){ui.focusIssue=null;const card=el.closest('.check-card');card?.classList.remove('needs-attention');card?.querySelector('.validation-hint')?.remove();}persist();}}}
  document.addEventListener('click',async event=>{const nav=event.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;
    if(action.startsWith('nav-')){navigate(action.slice(4));return;}
    if(action==='next-incomplete'){goToIncomplete();return;}
    if(action==='reload-history'){location.reload();return;}
    if(action==='new'){newModal(button.dataset.period||'daily');return;}
    if(action==='close-modal'){closeModal();return;}
    if(action==='resume'){ui.draftId=id;ui.query='';ui.category='all';ui.expanded=new Set();navigate('inspect');return;}
    if(action==='status'){
      const row=current()?.rows.find(item=>item.id===id);
      if(!row)return;
      row.status=row.status===button.dataset.status ? '' : button.dataset.status;
      row.checkedAt=row.status ? new Date().toISOString() : null;
      if(ui.focusIssue?.rowId===id)ui.focusIssue=null;
      if(button.closest('.phone-list')){
        window.DCPhone.showSelection(button,row.status);
        refreshPhoto(row);
      }else{
        rememberOpen();
        renderInspect();
      }
      persist();
      return;
    }
    if(action==='remove-photo'){confirmPhotoRemoval(current()?.rows.find(row=>row.id===id));return;}
    if(action==='asset-add'||action==='asset-edit'){assetModal(action==='asset-edit'?id:null);return;}
    if(action==='asset-toggle'){const a=state.assets.find(a=>a.id===id);a.active=!a.active;await persist();renderAssets();notify(a.active?'Aset diaktifkan untuk sesi baru.':'Aset dinonaktifkan untuk sesi baru. Riwayat tetap tersedia.');return;}
    if(action==='rule-add'||action==='rule-edit'){ruleModal(action==='rule-edit'?id:null);return;}
    if(action==='preview'){ui.reportId=null;navigate('report');return;}
    if((action==='finalize'||action==='confirm-finalize') && current()?.rows.some(row=>pendingPhotos.has(row))){notify('Tunggu hingga foto selesai disimpan.');return;}
    if(action==='finalize'||action==='confirm-finalize'){const done=C.completedInspection(state.reports,current());if(done){closeModal();renderInspect();return;}}
    if(action==='finalize'){const s=current(),issues=C.validate(s, simpleForm);if(issues.length){ui.validationActive=true;goToIncomplete();return;}ui.validationActive=false;ui.focusIssue=null;openModal('Selesaikan pemeriksaan?',`<p class="caption">Laporan final akan menyimpan salinan hasil, butir, aset, dan foto. ${C.metrics(s.rows).deferred?'Butir tertunda tetap dicatat sebagai belum diperiksa.':''} Perubahan bank checklist selanjutnya tidak mengubah laporan ini.</p>`,`<div class="modal-footer">${btn('Periksa kembali','close-modal')}${btn('Buat laporan final','confirm-finalize','','primary')}</div>`);return;}
    if(action==='confirm-finalize'){
      const draft=current();
      if(!draft || button.disabled)return;
      button.disabled=true;
      const index=state.drafts.indexOf(draft), previousSite=state.site;
      let finalReport;
      try{
        const number='INSP-'+draft.date.replaceAll('-','')+'-'+String(state.reports.length+1).padStart(3,'0');
        finalReport=C.finalize(draft,number,simpleForm);
        state.reports.push(finalReport);
        state.drafts.splice(index,1);
        state.site=draft.site;
        await persist(true);
      }catch(err){
        if(finalReport){
          state.reports=state.reports.filter(report=>report!==finalReport);
          state.drafts.splice(index,0,draft);
          state.site=previousSite;
        }
        notify(finalReport ? 'Laporan gagal disimpan. Draf masih tersedia. Coba kirim kembali.' : err.message);
        button.disabled=false;
        return;
      }
      ui.reportId=finalReport.id;ui.draftId=null;
      closeModal();navigate('report');notify('Laporan pemeriksaan berhasil dibuat.');
      return;
    }
    if(action==='reset-history'){ui.historyDate='';ui.historyQuery='';ui.historyPeriod='all';renderHistory();return;}
    if(action==='delete-draft'){confirmDraftRemoval(id);return;}
    if(action==='confirm-delete-draft'){
      const index=state.drafts.findIndex(draft=>draft.id===id);
      if(index<0){closeModal();return;}
      button.disabled=true;
      const [removed]=state.drafts.splice(index,1);
      try{
        await persist();
      }catch{
        state.drafts.splice(index,0,removed);
        button.disabled=false;
        notify('Draf gagal dihapus. Silakan coba lagi.');
        return;
      }
      if(ui.draftId===id){ui.draftId=null;ui.focusIssue=null;ui.validationActive=false;}
      closeModal();
      if(ui.view==='reports') renderHistory(); else renderDashboard();
      notify('Draf pemeriksaan dihapus.');
      return;
    }
    if(action==='delete-report'||action==='delete-all'){confirmReportRemoval(action==='delete-all'?'*':id);return;}
    if(action==='confirm-delete'){state.reports=state.reports.filter(r=>id!=='*'&&r.id!==id);await persist(true);closeModal();navigate('reports');notify('Riwayat yang dipilih sudah dihapus.');return;}
    if(action==='open-report'){closeModal();ui.reportId=id;navigate('report');return;}
    if(action==='excel') {
      const session=selectedReport();
      if(!session || ui.exportingExcel)return;
      ui.exportingExcel=true;
      const button=document.querySelector('[data-action="excel"]');
      const original=button.innerHTML;
      button.disabled=true;button.textContent='Menyiapkan Excel…';
      try {
        const snapshot=C.clone(session);
        const buffer=await window.DCIExcel.build(snapshot);
        download(`${snapshot.number||'DRAF'}-${snapshot.period}.xlsx`,buffer,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        notify('Laporan Excel beserta foto bukti berhasil diunduh.');
      } catch(error) {
        notify(error.message||'Ekspor Excel belum berhasil. Silakan coba kembali.');
      } finally {
        ui.exportingExcel=false;
        button.disabled=false;button.innerHTML=original;
      }
      return;
    }
    if(action==='print') {
      const session=selectedReport();
      if(!session||ui.preparingPrint)return;
      ui.preparingPrint=true;
      const original=button.innerHTML,previous=document.title;
      button.disabled=true;button.textContent='Menyiapkan cetakan…';
      try {
        await window.DCIReport.preparePrint(C.clone(session),$('#print-root'));
        document.title=`${session.number||'DRAF'} - Pemeriksaan ${D.periods[session.period]} - ${session.date}`;
        window.print();
      } catch {
        notify('Cetakan belum siap. Periksa foto bukti pada laporan, lalu coba kembali.');
      } finally {
        document.title=previous;ui.preparingPrint=false;
        button.disabled=false;button.innerHTML=original;
      }
      return;
    }
    if(action==='backup'){download(`DC-Inspect-cadangan-${C.localDate()}.json`,JSON.stringify({application:'DC Inspect',exportedAt:new Date().toISOString(),state},null,2),'application/json');notify('Cadangan berisi aset, butir, draf, laporan, dan foto.');return;}
    if(action==='restore'){openModal('Pulihkan cadangan',`<p class="caption">Pemulihan akan mengganti seluruh data pada browser ini dengan isi berkas cadangan. Simpan cadangan data saat ini sebelum melanjutkan.</p><div id="form-errors"></div><div class="field"><label for="restore-file">Berkas cadangan DC Inspect (.json)</label><input type="file" id="restore-file" accept="application/json,.json"></div>`,`<div class="modal-footer">${btn('Batal','close-modal')}${btn('Pulihkan data','confirm-restore','','primary')}</div>`);return;}
    if(action==='confirm-restore'){const file=$('#restore-file').files[0];if(!file){errors(['Pilih berkas cadangan terlebih dahulu.']);return;}try{if(file.size>25*1024*1024)throw new Error('Berkas melebihi batas prototipe 25 MB.');const data=JSON.parse(await file.text());validateBackup(data);state=data.state;upgradeCatalog(state);C.addDemoAssets(state,D);C.updateDemoAssetNames(state,D);await persist(true);closeModal();ui.draftId=null;ui.reportId=null;navigate('dashboard');notify('Cadangan berhasil dipulihkan.');}catch(err){errors([err.message||'Berkas cadangan tidak dapat dibaca.']);}return;}
  });
  document.addEventListener('submit',async event=>{event.preventDefault();const form=event.target,f=new FormData(form);
    if(form.id==='new-session'){if(C.completedInspection(state.reports,Object.fromEntries(f))){updateStartAvailability();return;}ui.validationActive=false;ui.focusIssue=null;const period=f.get('period'),rows=scheduledAssets(period).rows;if(!rows.length){errors(['Belum ada aset aktif dengan butir pada periode ini.']);return;}const session={id:uid('inspection'),period,date:f.get('date'),site:String(f.get('site')).trim(),inspector:String(f.get('inspector')).trim(),shift:'Umum',dailyParameterVersion:period==='daily'?state.dailyParameterVersion:null,templateSnapshotVersion:D.version,createdAt:new Date().toISOString(),rows};state.drafts.push(session);
      try{await persist();}catch{state.drafts=state.drafts.filter(d=>d!==session);return;}
      ui.draftId=session.id;ui.reportId=null;ui.query='';ui.category='all';ui.expanded=new Set();closeModal();navigate('inspect');notify('Checklist disiapkan untuk seluruh aset dalam jadwal.');}
    if(form.id==='asset-form'){const code=String(f.get('code')).trim(),id=form.dataset.id;if(state.assets.some(a=>a.id!==id&&a.code.toLowerCase()===code.toLowerCase())){errors(['Kode aset sudah digunakan. Gunakan kode unik untuk setiap unit.']);return;}const values=Object.fromEntries(['code','name','category','subtype','location','responsible','manufacturer','model'].map(k=>[k,String(f.get(k)||'').trim()]));if(!values.code||!values.name||!values.location){errors(['Kode, nama, dan lokasi aset wajib diisi.']);return;}if(id)Object.assign(state.assets.find(a=>a.id===id),values);else state.assets.push({id:uid('asset'),...values,active:true});await persist();closeModal();renderAssets();notify('Daftar aset diperbarui.');}
    if(form.id==='rule-form'){const id=form.dataset.id,values=Object.fromEntries(['title','category','period','criterion','method','role'].map(k=>[k,String(f.get(k)||'').trim()]));values.measurement=f.get('measurement')==='on';if(!values.title||!values.criterion){errors(['Butir dan kriteria penerimaan wajib diisi.']);return;}if(id){const rule=state.rules.find(r=>r.id===id);if(rule.title!==values.title||rule.category!==values.category||rule.period!==values.period){values.source='Penyesuaian lokal';if(rule.category!==values.category)values.applies=null;}Object.assign(rule,values);}else state.rules.push({id:uid('rule'),...values,source:'Usulan operasional',sourceUrl:'',originalPeriod:'Tambahan lokal',applies:null});await persist();closeModal();renderRules();notify('Bank checklist diperbarui untuk sesi berikutnya.');}
  });
  const searchTimers={};
  document.addEventListener('input',event=>{const el=event.target;saveInput(el);if(el.closest('#new-session') && ['site','date'].includes(el.name))updateStartAvailability();const searches={'inspection-search':['query',renderInspect],'asset-search':['assetQuery',renderAssets],'rule-search':['ruleQuery',renderRules],'history-search':['historyQuery',renderHistory]};if(searches[el.id]){const [key,render]=searches[el.id],pos=el.selectionStart;ui[key]=el.value;clearTimeout(searchTimers[key]);searchTimers[key]=setTimeout(()=>{if(key==='query')rememberOpen();render();const target=document.getElementById(el.id);target?.focus();target?.setSelectionRange(pos,pos);},220);}});
  document.addEventListener('change',async event=>{const el=event.target;saveInput(el);const filters={'inspection-category':['category',renderInspect],'asset-category':['assetCategory',renderAssets],'rule-category':['ruleCategory',renderRules],'rule-period':['rulePeriod',renderRules],'history-period':['historyPeriod',renderHistory],'history-date':['historyDate',renderHistory]};if(filters[el.id]){const [key,render]=filters[el.id];ui[key]=el.value;if(key==='category')rememberOpen();render();}if(el.id==='new-period')renderSchedule(el.value);
    if(['date','site'].includes(el.dataset.meta) && C.completedInspection(state.reports,current())){renderInspect();return;}
    if(el.id==='asset-form-category')$('#subtype').innerHTML=subtypeOptions(el.value,'system');if(el.dataset.photo)await attachPhoto(el);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal();if(event.key==='Tab'&&$('#modal-root .modal')){const nodes=[...$('#modal-root .modal').querySelectorAll('button,input,select,textarea,a[href]')].filter(n=>!n.disabled&&!n.hidden),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
  const pendingPhotos = new Set();
  function confirmPhotoRemoval(row) {
    if (!row?.evidence?.length || pendingPhotos.has(row)) return;
    const photos = row.evidence;
    const message = `<p>Hapus foto bukti untuk <strong>${e(label(row.assetName || row.assetCode))}</strong>?</p><p class="caption">${e(label(row.title))}</p>`;
    openModal('Hapus foto bukti?', message, `<div class="modal-footer">
      ${btn('Batal','close-modal','data-initial-focus')}
      <button type="button" class="btn photo-remove" id="confirm-photo-removal">Ya, hapus foto</button>
    </div>`);
    $('#confirm-photo-removal').addEventListener('click', async () => {
      closeModal();
      if (!current()?.rows.includes(row) || row.evidence !== photos || pendingPhotos.has(row)) return;
      pendingPhotos.add(row);
      row.evidence = [];
      try {
        await persist();
        notify('Foto bukti dihapus.');
      } catch {
        row.evidence = photos;
        notify('Foto gagal dihapus. Silakan coba lagi.');
      } finally {
        pendingPhotos.delete(row);
        if (current()?.rows.includes(row)) refreshPhoto(row);
      }
    }, {once:true});
  }
  function refreshPhoto(row) {
    const box = document.getElementById('photo-' + row.id);
    if (box) box.innerHTML = photoField(row);
  }
  async function attachPhoto(input) {
    const file = input.files[0], session = current();
    const row = session?.rows.find(item => item.id === input.dataset.photo);
    if (!file || !row || row.status !== 'fail') return;
    input.value = '';
    if (pendingPhotos.has(row)) return;
    pendingPhotos.add(row);
    const previous = row.evidence;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Ukuran foto maksimal 20 MB.');
      const data = await compressPhoto(file);
      if (row.status !== 'fail' || !state.drafts.includes(session)) return;
      row.evidence = [{name:file.name, data, addedAt:new Date().toISOString()}];
      await persist();
      if (current() === session) {
        refreshPhoto(row);
        notify('Foto tersimpan pada butir ini.');
      }
    } catch (error) {
      row.evidence = previous;
      notify(error.message || 'Foto gagal disimpan. Coba pilih kembali.');
    } finally {
      pendingPhotos.delete(row);
    }
  }
  async function compressPhoto(file){if(!file.type.startsWith('image/'))throw new Error('Pilih berkas gambar.');return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{const ratio=Math.min(1,1000/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.72));}catch(err){reject(err);}finally{URL.revokeObjectURL(url);}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Format foto belum dapat dibaca. Gunakan JPEG, PNG, atau WebP.'));};img.src=url;});}
  function validateBackup(data){const s=data?.state;if(data?.application!=='DC Inspect'||s?.schemaVersion!==1||!Array.isArray(s.assets)||!Array.isArray(s.rules)||!Array.isArray(s.drafts)||!Array.isArray(s.reports)||typeof s.site!=='string')throw new Error('Berkas bukan cadangan DC Inspect yang didukung.');const known=D.categories.map(c=>c.id);if(s.assets.length>10000||s.rules.length>20000||s.reports.length>10000)throw new Error('Jumlah data melebihi batas prototipe.');if(s.assets.some(a=>typeof a.id!=='string'||typeof a.code!=='string'||typeof a.name!=='string'||!known.includes(a.category)))throw new Error('Struktur data aset tidak valid.');if(s.rules.some(r=>typeof r.id!=='string'||typeof r.title!=='string'||typeof r.criterion!=='string'||!known.includes(r.category)||!D.periods[r.period]))throw new Error('Struktur butir checklist tidak valid.');for(const session of [...s.drafts,...s.reports]){if(typeof session.id!=='string'||!D.periods[session.period]||!Array.isArray(session.rows)||typeof session.date!=='string')throw new Error('Struktur laporan atau draf tidak valid.');for(const r of session.rows){if(typeof r.title!=='string'||typeof r.id!=='string'||!known.includes(r.category)||!['','pass','fail','na','deferred'].includes(r.status)||!Array.isArray(r.evidence)||r.evidence.some(p=>!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(p.data)))throw new Error('Butir atau bukti foto dalam cadangan tidak valid.');}}}
  matchMedia('(max-width: 650px)').addEventListener('change',()=>{if(ui.view==='inspect')renderInspect();});
  await persist();shell();if(dailyUpdate.changed)notify('Checklist harian diperbarui ke 41 parameter bahasa Indonesia. Gunakan sesi baru untuk checklist terbaru.');if(fallback)notify('Mode penyimpanan cadangan digunakan. Ekspor data sebelum menutup sesi.');
})();

