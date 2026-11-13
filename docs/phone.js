(function () {
  const phone = window.matchMedia('(max-width: 650px)');
  const escape = window.DCICore.escape, label = window.DCIData.formalLabel;
  const answers = [['pass', 'Sesuai'], ['fail', 'Tidak sesuai']];
  const expanded = new Map();
  const arrow = '<span class="fold-arrow" aria-hidden="true">›</span>';
  function openAttribute(key, initial, hasIssue) {
    return (hasIssue || (expanded.has(key) ? expanded.get(key) : initial)) ? 'open' : '';
  }
  function progress(rows) {
    const filled = rows.filter(row => row.status).length;
    const failed = rows.filter(row => row.status === 'fail').length;
    return `${filled}/${rows.length} terisi${failed ? ' · ' + failed + ' tidak sesuai' : ''}`;
  }
  // Keep disclosure state across form redraws without changing saved inspection data.
  document.addEventListener('toggle', event => {
    const section = event.target;
    if (section.matches?.('details[data-fold-key]') && section.isConnected) {
      expanded.set(section.dataset.foldKey, section.open);
    }
  }, true);
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-fold-all]');
    if (!control) return;
    document.querySelectorAll('#checklist details[data-fold-key]').forEach(section => {
      section.open = control.dataset.foldAll === 'open';
      expanded.set(section.dataset.foldKey, section.open);
    });
  });

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
    const sections = core.groupByCategory(session.rows).map((category, categoryIndex) => {
      const assets=core.groupByAsset(category.rows);
      const groups=new Map();
      for(const row of category.rows){
        // Include the exact question text so differing historical snapshots remain separate.
        const key=JSON.stringify([row.templateId||'',row.title]);
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(row);
      }
      const categoryKey = JSON.stringify([session.id, category.id]);
      return `<details class="inspection-category inspection-fold" data-fold-key="${escape(categoryKey)}" ${openAttribute(categoryKey, categoryIndex === 0, category.rows.some(row => issue?.rowId === row.id))}>
        <summary class="category-heading">${arrow}<span class="fold-copy"><span class="fold-title">${escape(label(category.name))}</span>
          <span class="fold-meta">${assets.length} aset · ${groups.size} parameter</span>
          <span class="fold-progress" data-fold-progress>${progress(category.rows)}</span></span></summary><div class="category-parameters">
        ${[...groups.values()].map((rows,groupIndex)=>{
          const parameterId='parameter-'+escape(category.id)+'-'+groupIndex;
          const key = JSON.stringify([session.id, category.id, rows[0].templateId || '', rows[0].title]);
          return `<details class="asset-group parameter-group inspection-fold" data-fold-key="${escape(key)}" ${openAttribute(key, categoryIndex === 0 && groupIndex === 0, rows.some(row => issue?.rowId === row.id))}><summary>${arrow}<span class="fold-copy"><span class="fold-title" id="${parameterId}">${groupIndex+1}. ${escape(label(rows[0].title))}</span>
            <span class="fold-progress" data-fold-progress>${progress(rows)}</span></span></summary><div class="parameter-assets">
            ${rows.map((row,i)=>card(row,i,issue,photoField,parameterId)).join('')}</div></details>`;
        }).join('')}
      </div></details>`;
    }).join('');
    return `<div class="fold-toolbar"><p>Ketuk tanda panah untuk membuka kategori dan parameter.</p><div class="button-row"><button type="button" class="btn" data-fold-all="close">Tutup semua</button><button type="button" class="btn" data-fold-all="open">Buka semua</button></div></div><div class="phone-list" id="checklist">${sections}</div>
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
    for (let section = item.parentElement; section; section = section.parentElement) {
      if (!section.matches('details[data-fold-key]')) continue;
      const rows = [...section.querySelectorAll('.check-card')].map(card => ({status: card.querySelector('.status-btn.selected')?.dataset.status || ''}));
      section.querySelector(':scope > summary [data-fold-progress]').textContent = progress(rows);
    }
  }
  window.DCPhone = {phone, form, showSelection};
})();

