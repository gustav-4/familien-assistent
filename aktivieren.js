try {
  localStorage.setItem('lizenz_aktiv',  'true');
  localStorage.setItem('lizenz_ablauf', String(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000));
  localStorage.setItem('lizenz_plan',   'lifetime');
} catch(e) {}
