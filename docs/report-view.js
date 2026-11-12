(function(root) {
  'use strict';
  const C=root.DCICore,D=root.DCIData,e=C.escape,label=D.formalLabel;
  const statusLabels={pass:'Sesuai',fail:'Tidak sesuai',na:'Tidak berlaku',deferred:'Tertunda','':'Belum dinilai'};
  function date(value) {
    if(!value)return 'Belum tercatat';
    const parsed=new Date(value.length===10?value+'T12:00:00+07:00':value);
    if(isNaN(parsed))return 'Belum tercatat';
    return new Intl.DateTimeFormat('id-ID',{dateStyle:'long',...(value.length===10?{}:{timeStyle:'short'}),timeZone:'Asia/Jakarta'}).format(parsed)+(value.length===10?'':' WIB');
  }
  function note(row) {
    const parts=[row.note];
    if(String(row.reading??'').trim())parts.push(`Hasil ukur: ${row.reading}`);
    if(row.status==='fail') {
      if(row.priority)parts.push(`Prioritas: ${row.priority}`);
      if(row.pic)parts.push(`PIC: ${row.pic}`);
      if(row.target)parts.push(`Target tindak lanjut: ${date(row.target)}`);
    }
    return parts.filter(Boolean).join('\n')||'—';
  }
  function photo(photo,row) {
    return `<img class="report-photo" src="${e(photo.data)}" alt="Foto bukti ${e(label(row.assetName))} — ${e(label(row.title))}" loading="eager">`;
  }
  function result(row) {
    const color=row.status==='fail'?'result-fail':row.status==='pass'?'result-pass':'';
    return `<span class="result-label ${color}">${e(statusLabels[row.status]||'Belum dinilai')}</span>`;
  }
  function splitForPrint(text,width) {
    const lines=[];
    for(const paragraph of String(text).split('\n')) {
      let rest=paragraph;
      if(!rest)lines.push('');
      while(rest.length>width) {
        const space=rest.lastIndexOf(' ',width),end=space>0?space:width;
        lines.push(rest.slice(0,end));rest=rest.slice(end).trimStart();
      }
      if(rest)lines.push(rest);
    }
    const parts=[];
    for(let start=0;start<lines.length;start+=12)parts.push(lines.slice(start,start+12).join('\n'));
    return parts.length?parts:[''];
  }
  function recordRows(row,number,category,print) {
    const objects=C.reportObjects(row);
    const values=[row.assetCode||'—',label(row.assetName),row.location||'—',note(row)];
    const parts=values.map((value,index)=>print?splitForPrint(value,[22,40,27,36][index]):[value]);
    const photos=row.evidence||[];
    const count=print?Math.max(...parts.map(part=>part.length),photos.length,1):1;
    return Array.from({length:count},(_,index)=>{
      const pictures=print?(photos[index]?[photos[index]]:[]):photos;
      return `<tr class="inspection-result ${index?'result-continuation':''}">
        <td class="number-cell" data-label="No">${number}${index?'<small>lanj.</small>':''}</td>
        <td class="category-cell" data-label="Kode Aset">${e(parts[0][index]||'—')}</td>
        <td class="parameter-cell" data-label="Nama Aset">${e(parts[1][index]||(index?'Lanjutan aset '+number:''))}</td>
        <td class="objects-cell" data-label="Lokasi">${e(parts[2][index]||'—')}</td>
        <td class="result-cell" data-label="Hasil">${index?'':result(row)}</td>
        <td class="notes-cell" data-label="Keterangan Petugas / Hasil Ukur">${e(parts[3][index]||'—')}</td>
        <td class="photos-cell" data-label="Foto Bukti">${pictures.map(picture=>photo(picture,row)).join('')||(index?'':'<span class="no-photo">—</span>')}</td>
      </tr>`;
    }).join('');
  }
  function html(session,{print=false}={}) {
    const rows=session.rows||[],metrics=C.metrics(rows),groups=C.groupByCategory(rows);
    const photos=rows.reduce((count,row)=>count+(row.evidence?.length||0),0);
    const fields=[['Nomor laporan',session.number||'DRAF'],['Status',session.finalizedAt?'Final':'Draf'],
      ['Hari / tanggal',date(session.date)],['Pusat data',session.site||'Belum diisi'],
      ['Petugas',session.inspector||'Belum diisi'],['Sif',session.shift||'Umum'],
      ['Mulai pencatatan',date(session.createdAt)],['Laporan dikirim',date(session.finalizedAt)],
      ['Cakupan',`${C.groupByAsset(rows).length} aset · ${C.groupByParameter(rows).length} parameter · ${rows.length} penilaian`],['Foto bukti',`${photos} foto`]];
    const counts=[['Sesuai',metrics.pass,'pass'],['Tidak sesuai',metrics.fail,'fail']];
    if(metrics.pending)counts.push(['Belum dinilai',metrics.pending,'']);
    if(metrics.na)counts.push(['Tidak berlaku',metrics.na,'']);
    if(metrics.deferred)counts.push(['Tertunda',metrics.deferred,'']);
    let number=0;
    const tables=groups.map(category=>C.groupByParameter(category.rows).map(assetRows=>{
      const asset=assetRows[0];
      return `<section class="asset-report"><table aria-label="Hasil pemeriksaan ${e(label(asset.title))}">
        <colgroup><col class="number-col"><col class="category-col"><col class="parameter-col"><col class="objects-col"><col class="result-col"><col class="notes-col"><col class="photos-col"></colgroup>
        <thead><tr><th colspan="7" class="report-category-title">${e(label(category.name))}</th></tr>
          <tr><th colspan="7" class="asset-report-heading"><h3>${e(label(asset.title))}</h3><p>${assetRows.length} penilaian aset</p></th></tr>
          <tr class="report-columns">${['No','Kode Aset','Nama Aset','Lokasi','Hasil','Keterangan Petugas / Hasil Ukur','Foto Bukti'].map(title=>`<th scope="col">${e(title)}</th>`).join('')}</tr></thead>
        <tbody>${assetRows.map(row=>recordRows(row,++number,category.name,print)).join('')}</tbody>
      </table></section>`;
    }).join('')).join('');
    return `<article class="report-preview structured-report">
      <header class="report-cover"><div class="report-brand">DC Inspect</div>
        <h2 class="report-title">FORMULIR MONITORING ${e((D.periods[session.period]||session.period).toUpperCase())} DATA CENTER</h2>
        <p class="report-subtitle">${e(session.site||'Pusat data')} · ${e(date(session.date))}</p></header>
      <dl class="report-metadata">${fields.map(([name,value])=>`<div><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
      <div class="report-counts">${counts.map(([name,count,kind])=>`<span class="count-${kind}"><strong>${count}</strong> ${e(name)}</span>`).join('')}</div>
      ${tables}
      <div class="signature"><div>Petugas pemeriksa<strong>${e(session.inspector||'________________')}</strong></div><div>Peninjau<strong>________________</strong></div></div>
    </article>`;
  }
  async function preparePrint(session,target) {
    target.innerHTML=html(session,{print:true});
    await Promise.all([...target.querySelectorAll('img')].map(image=>image.decode()));
    await document.fonts.ready;
  }
  root.DCIReport={html,preparePrint};
})(typeof window!=='undefined'?window:globalThis);
