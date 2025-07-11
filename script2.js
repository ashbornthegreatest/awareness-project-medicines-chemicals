document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('results');

  if (query === '') {
    resultsDiv.innerHTML = `<p>Please enter a medicine name! 💊</p>`;
    return;
  }

  fetch('medicines.json')
    .then(response => response.json())
    .then(data => {
      const med = data.find(m => m.name.toLowerCase() === query);

      if (!med) {
        resultsDiv.innerHTML = `<p>No data found for "${query}". 🫥</p>`;
        return;
      }

      resultsDiv.innerHTML = `
        <h2>${med.name}</h2>
        <p><strong>Uses:</strong> ${med.uses}</p>
        <p><strong>Dosage:</strong> ${med.dosage}</p>
        <p><strong>Side Effects:</strong> ${med.sideEffects}</p>
        <p><strong>Precautions:</strong> ${med.precautions}</p>
        <p><strong>Description:</strong> ${med.description}</p>
        <p><strong>Mechanism:</strong> ${med.mechanism}</p>
      `;
    })
    .catch(error => {
      console.error(error);
      resultsDiv.innerHTML = `<p>Oops! Could not fetch medicine data. 🧯</p>`;
    });
});
