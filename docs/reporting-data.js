(function(root) {
  'use strict';
  // Descriptive scope for CSV. One inspection result belongs to each parameter.
  root.DCIData.dailyReportObjects={
  "dcos26-facility-daily-1": {
    "title": "Laksanakan pembersihan rutin di dalam gedung, termasuk kamar mandi dan lantai.",
    "objects": [
      "Toilet",
      "Ruang janitor",
      "Lantai koridor",
      "Lantai ruang data"
    ]
  },
  "dcos26-bms-daily-1": {
    "title": "Periksa sensor yang terlihat untuk memastikan tidak ada kerusakan atau penghalang.",
    "objects": [
      "Bodi sensor yang terlihat",
      "Dudukan sensor",
      "Permukaan pendeteksi",
      "Area bebas halangan di sekitar sensor"
    ]
  },
  "dcos26-bms-daily-2": {
    "title": "Periksa log kesalahan.",
    "objects": [
      "Entri kesalahan baru",
      "Waktu kejadian pada log",
      "Sensor atau perangkat sumber",
      "Kesalahan yang berulang"
    ]
  },
  "dcos26-bms-daily-3": {
    "title": "Cadangkan berkas log.",
    "objects": [
      "Berkas log sumber",
      "Lokasi tujuan cadangan",
      "Status proses pencadangan",
      "Berkas hasil cadangan"
    ]
  },
  "dcos26-cctv-daily-1": {
    "title": "Periksa kualitas gambar kamera.",
    "objects": [
      "Ketajaman gambar tiap kamera",
      "Pencahayaan gambar",
      "Gangguan atau distorsi gambar",
      "Bagian gambar yang terhalang"
    ]
  },
  "dcos26-cctv-daily-2": {
    "title": "Periksa log kesalahan sistem CCTV.",
    "objects": [
      "Entri kesalahan kamera",
      "Entri kesalahan perekam",
      "Waktu dan kanal sumber kesalahan",
      "Kesalahan yang berulang"
    ]
  },
  "dcos26-cctv-daily-3": {
    "title": "Periksa perangkat perekam video, meliputi kualitas rekaman, ruang penyimpanan yang tersedia, dan kondisi lingkungannya.",
    "objects": [
      "Gambar hasil pemutaran rekaman",
      "Sisa kapasitas penyimpanan",
      "Suhu sekitar perekam",
      "Ventilasi sekitar perekam"
    ]
  },
  "dcos26-access-daily-1": {
    "title": "Periksa log kesalahan.",
    "objects": [
      "Entri kesalahan pembaca akses",
      "Entri kesalahan pengendali pintu",
      "Waktu dan pintu sumber kesalahan",
      "Kesalahan yang berulang"
    ]
  },
  "dcos26-access-daily-2": {
    "title": "Periksa log kejadian, termasuk catatan percobaan akses masuk yang tidak valid.",
    "objects": [
      "Kejadian akses ditolak",
      "Waktu percobaan masuk",
      "Titik pintu atau pembaca kartu",
      "Percobaan tidak sah yang berulang"
    ]
  },
  "dcos26-access-daily-3": {
    "title": "Periksa status kesiapan sistem pengunci bermotor atau magnetik.",
    "objects": [
      "Perintah penguncian",
      "Respons kunci saat diaktifkan",
      "Posisi pintu setelah terkunci",
      "Indikasi status kunci"
    ]
  },
  "dcos26-fire-daily-1": {
    "title": "Periksa jalur evakuasi: bebas hambatan, pintu dapat dibuka dan ditutup, rambu terlihat, dan penerangan berfungsi.",
    "objects": [
      "Jalur evakuasi bebas hambatan",
      "Fungsi buka-tutup pintu evakuasi",
      "Keterlihatan rambu evakuasi",
      "Penerangan jalur evakuasi"
    ]
  },
  "dcos26-fire-daily-2": {
    "title": "Pastikan panel alarm kebakaran menunjukkan status normal.",
    "objects": [
      "Indikator daya panel",
      "Indikator kondisi normal",
      "Indikator alarm aktif",
      "Indikator gangguan panel"
    ]
  },
  "dcos26-fire-daily-3": {
    "title": "Pastikan seluruh peralatan keselamatan kebakaran berada di tempatnya, terlihat, dan mudah diakses, termasuk sirene, rambu, APAR, dan akses hidran.",
    "objects": [
      "Sirene alarm kebakaran",
      "Rambu keselamatan kebakaran",
      "Alat pemadam api ringan (APAR)",
      "Hidran dan akses menuju hidran"
    ]
  },
  "dcos26-fuel-daily-1": {
    "title": "Periksa kebocoran dan kerusakan yang terlihat secara langsung.",
    "objects": [
      "Dinding tangki BBM",
      "Sambungan pipa yang terlihat",
      "Katup dan sambungan pengisian",
      "Area penampung di sekitar tangki"
    ]
  },
  "dcos26-generator-daily-1": {
    "title": "Periksa tingkat bahan bakar.",
    "objects": [
      "Level bahan bakar"
    ]
  },
  "dcos26-generator-daily-2": {
    "title": "Periksa dan catat tingkat serta tekanan oli, serta suhu air atau cairan pendingin.",
    "objects": [
      "Level oli mesin",
      "Tekanan oli mesin",
      "Suhu cairan pendingin"
    ]
  },
  "dcos26-generator-daily-3": {
    "title": "Periksa adanya kebocoran.",
    "objects": [
      "Jalur bahan bakar",
      "Sambungan dan selang oli",
      "Jalur cairan pendingin",
      "Area bawah genset"
    ]
  },
  "dcos26-generator-daily-4": {
    "title": "Periksa status panel kontrol.",
    "objects": [
      "Indikator daya panel",
      "Mode operasi yang ditampilkan",
      "Indikator kesiapan genset",
      "Pesan alarm atau gangguan"
    ]
  },
  "dcos26-transformer-daily-1": {
    "title": "Periksa suhu transformator.",
    "objects": [
      "Nilai suhu pada indikator lokal",
      "Nilai suhu pada layar pantau (jika ada)",
      "Kesesuaian bacaan dengan batas operasi",
      "Indikator peringatan suhu"
    ]
  },
  "dcos26-transformer-daily-2": {
    "title": "Periksa adanya suara dan getaran yang tidak normal.",
    "objects": [
      "Bunyi dengung transformator",
      "Bunyi lain yang tidak biasa",
      "Getaran pada badan transformator",
      "Getaran pada dudukan transformator"
    ]
  },
  "dcos26-transformer-daily-3": {
    "title": "Periksa adanya kebocoran.",
    "objects": [
      "Badan tangki trafo berisi oli",
      "Sambungan yang terlihat",
      "Area katup atau saluran oli",
      "Jejak cairan di bawah transformator"
    ]
  },
  "dcos26-ups-daily-1": {
    "title": "Periksa kebersihan UPS.",
    "objects": [
      "Permukaan luar kabinet UPS",
      "Kisi udara masuk",
      "Kisi udara keluar",
      "Area sekitar kabinet UPS"
    ]
  },
  "dcos26-ups-daily-2": {
    "title": "Periksa indikasi alarm pada panel pemantauan UPS dan baterai.",
    "objects": [
      "Indikator alarm UPS",
      "Pesan gangguan pada layar UPS",
      "Indikator alarm pemantau baterai",
      "Pesan gangguan pada pemantau baterai"
    ]
  },
  "dcos26-ups-daily-3": {
    "title": "Periksa suhu serta adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.",
    "objects": [
      "Suhu yang ditampilkan UPS",
      "Peringatan suhu pada panel",
      "Bunyi tidak biasa dari unit",
      "Getaran tidak biasa pada unit"
    ]
  },
  "dcos26-dynamic-daily-1": {
    "title": "Periksa tingkat bahan bakar.",
    "objects": [
      "Level bahan bakar"
    ]
  },
  "dcos26-dynamic-daily-2": {
    "title": "Periksa dan catat tingkat serta tekanan oli, serta suhu air atau cairan pendingin.",
    "objects": [
      "Level oli mesin",
      "Tekanan oli mesin",
      "Suhu cairan pendingin"
    ]
  },
  "dcos26-dynamic-daily-3": {
    "title": "Periksa status panel kontrol.",
    "objects": [
      "Indikator daya panel UPS",
      "Mode operasi yang ditampilkan",
      "Indikator kesiapan unit",
      "Pesan alarm atau gangguan"
    ]
  },
  "dcos26-dynamic-daily-4": {
    "title": "Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.",
    "objects": [
      "Bunyi pada mesin penggerak",
      "Bunyi pada bagian berputar",
      "Getaran pada badan unit",
      "Getaran pada dudukan unit"
    ]
  },
  "dcos26-chiller-daily-1": {
    "title": "Pastikan seluruh peralatan beroperasi dan sistem keselamatan terpasang serta siap digunakan.",
    "objects": [
      "Status operasi unit chiller",
      "Status operasi kompresor",
      "Pelindung fisik yang terpasang",
      "Indikator sistem pengaman"
    ]
  },
  "dcos26-chiller-daily-2": {
    "title": "Periksa nilai pengaturan (set point).",
    "objects": [
      "Parameter setelan yang dipilih",
      "Nilai suhu target pada pengendali",
      "Satuan nilai setelan",
      "Kesesuaian setelan dengan acuan operasi"
    ]
  },
  "dcos26-chiller-daily-3": {
    "title": "Periksa panel kontrol dan panel alarm.",
    "objects": [
      "Indikator daya panel kontrol",
      "Tampilan status operasi",
      "Indikator alarm aktif",
      "Rincian pesan pada panel alarm"
    ]
  },
  "dcos26-chiller-daily-4": {
    "title": "Periksa pembacaan parameter air suplai, air balik, dan laju aliran air.",
    "objects": [
      "Aliran air pada jalur pasokan",
      "Aliran air pada jalur balik",
      "Nilai debit yang ditampilkan",
      "Kesesuaian debit dengan acuan operasi"
    ]
  },
  "dcos26-chiller-daily-5": {
    "title": "Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.",
    "objects": [
      "Bunyi kompresor",
      "Bunyi dari komponen penggerak",
      "Getaran pada unit chiller",
      "Getaran pada dudukan unit"
    ]
  },
  "dcos26-chiller-daily-6": {
    "title": "Periksa tingkat oli kompresor sesuai teknologi yang digunakan, serta adanya kebocoran oli.",
    "objects": [
      "Indikator level oli (jika tersedia)",
      "Nilai level oli sesuai jenis kompresor",
      "Rembesan pada badan kompresor",
      "Rembesan pada sambungan jalur oli"
    ]
  },
  "dcos26-tower-daily-1": {
    "title": "Pastikan seluruh peralatan beroperasi dan sistem keselamatan terpasang serta siap digunakan.",
    "objects": [
      "Status operasi kipas",
      "Status sirkulasi air",
      "Pelindung fisik yang terpasang",
      "Indikator sistem pengaman"
    ]
  },
  "dcos26-tower-daily-2": {
    "title": "Periksa aliran air.",
    "objects": [
      "Aliran air masuk",
      "Sebaran air pada menara",
      "Aliran air keluar",
      "Kelancaran sirkulasi air"
    ]
  },
  "dcos26-tower-daily-3": {
    "title": "Periksa panel kontrol dan panel alarm.",
    "objects": [
      "Indikator daya panel kontrol",
      "Tampilan status operasi",
      "Indikator alarm aktif",
      "Rincian pesan pada panel alarm"
    ]
  },
  "dcos26-tower-daily-4": {
    "title": "Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.",
    "objects": [
      "Bunyi pada kipas",
      "Bunyi pada motor penggerak",
      "Getaran pada rangka menara",
      "Getaran pada dudukan kipas atau motor"
    ]
  },
  "dcos26-hvac-daily-1": {
    "title": "Periksa nilai pengaturan suhu dan kelembapan.",
    "objects": [
      "Setelan suhu pada pengendali",
      "Kesesuaian suhu target dengan acuan",
      "Setelan kelembapan pada pengendali",
      "Kesesuaian kelembapan target dengan acuan"
    ]
  },
  "dcos26-hvac-daily-2": {
    "title": "Periksa adanya penghalang pada saluran udara masuk dan keluar.",
    "objects": [
      "Kisi saluran udara masuk",
      "Ruang bebas di depan udara masuk",
      "Kisi saluran udara keluar",
      "Ruang bebas di depan udara keluar"
    ]
  },
  "dcos26-hvac-daily-3": {
    "title": "Periksa adanya suara dan getaran yang tidak normal dengan tetap mematuhi ketentuan keselamatan.",
    "objects": [
      "Bunyi dari kipas unit",
      "Bunyi lain yang tidak biasa",
      "Getaran pada kabinet unit",
      "Getaran pada dudukan unit"
    ]
  }
};
  const data=root.DCIData;
  for (const rule of data.rules) rule.title=data.formalLabel(rule.title);
  for (const reference of Object.values(data.dailyReportObjects)) {
    reference.title=data.formalLabel(reference.title);
    reference.objects=reference.objects.map(data.formalLabel);
  }
  data.version='web-26.3';
})(typeof window!=='undefined'?window:globalThis);
