(function () {
  const phone = window.matchMedia('(max-width: 650px)');
  const escape = window.DCICore.escape, label = window.DCIData.formalLabel;
  const answers = [['pass', 'Sesuai'], ['fail', 'Tidak sesuai']];

  function card(row, index, issue, photoField, parameterId) {
    const id = escape(row.id);
    const activeIssue = issue?.rowId === row.id;
    const buttons = answers.map(([value, label]) => {
      const selected = value === row.status;
      return `<button type="button" class="status-btn ${selected ? 'selected ' + value : ''}" data-action="status" data-id="${id}" data-status="${value}" aria-pressed="${selected}"><span class="choice-mark" aria-hidden="true"></span>${label}</button>`;
    }).join('');
    return `<article class="check-card is-${escape(row.status || 'pending')} ${activeIssue ? 'needs-attention' : ''}" data-row="${id}">
      <h4 id="title-${id}"><span class="check-num">${index + 1}</span><span>${escape(label(row.assetName))}</span></h4>
      <p class="asset-context">${escape(row.assetCode)} · ${escape(row.location)}</p>
      ${activeIssue ? `<p class="validation-hint" role="alert">${escape(issue.message)}</p>` : ''}
      <div class="status-buttons" role="group" aria-labelledby="${parameterId} title-${id}">${buttons}</div>
      <div class="field"><label for="note-${id}">Keterangan${row.status === 'fail' ? ' *' : ''}</label>
        <textarea id="note-${id}" data-row-field="note" data-id="${id}" rows="2" ${row.status === 'fail' ? 'required' : ''}>${escape(row.note)}</textarea>
      </div>
      <div id="photo-${id}">${photoField(row)}</div>
    </article>`;
  }

  function form(session, issue, photoField) {
    const core=window.DCICore;
    const sections = core.groupByCategory(session.rows).map(category => {
      const assets=core.groupByAsset(category.rows);
      const groups=new Map();
      for(const row of category.rows){
        // Include the exact question text so differing historical snapshots remain separate.
        const key=JSON.stringify([row.templateId||'',row.title]);
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(row);
      }
      return `<section class="inspection-category" aria-labelledby="category-${escape(category.id)}">
        <header class="category-heading"><h2 id="category-${escape(category.id)}">${escape(label(category.name))}</h2>
          <p>${assets.length} aset · ${groups.size} parameter · ${category.rows.length} penilaian</p></header>
        ${[...groups.values()].map((rows,groupIndex)=>{
          const parameterId='parameter-'+escape(category.id)+'-'+groupIndex;
          return `<section class="asset-group parameter-group" aria-labelledby="${parameterId}"><header><h3 id="${parameterId}">${groupIndex+1}. ${escape(label(rows[0].title))}</h3>
            <p>${rows.length} aset yang dinilai</p></header><div class="parameter-assets">
            ${rows.map((row,i)=>card(row,i,issue,photoField,parameterId)).join('')}</div></section>`;
        }).join('')}
      </section>`;
    }).join('');
    return `<div class="phone-list" id="checklist">${sections}</div>
      <footer class="phone-submit"><p id="save-state">Draf tersimpan di perangkat ini</p>
      <button class="btn primary" type="button" data-action="finalize">Kirim pemeriksaan</button></footer>`;
  }

  function showSelection(button, status) {
    const item = button.closest('.check-card');
    item.classList.remove('is-pass', 'is-fail', 'is-na', 'is-deferred', 'is-pending', 'needs-attention');
    item.classList.add('is-' + (status || 'pending'));
    item.querySelector('.validation-hint')?.remove();
    for (const choice of item.querySelectorAll('.status-btn')) {
      const selected = choice.dataset.status === status;
      choice.className = 'status-btn' + (selected ? ' selected ' + status : '');
      choice.setAttribute('aria-pressed', String(selected));
    }
    item.querySelector('textarea').required = status === 'fail';
    item.querySelector('label').textContent = status === 'fail' ? 'Keterangan *' : 'Keterangan';
  }
  window.DCPhone = {phone, form, showSelection};
})();

