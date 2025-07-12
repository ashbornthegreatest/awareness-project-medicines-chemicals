document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('show');
});


document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim();
  const resultsDiv = document.getElementById('results');

  if (query === '') {
    resultsDiv.innerHTML = `<p>Please enter a chemical name!</p>`;
    return;
  }

  resultsDiv.innerHTML = `<p>Searching PubChem for <strong>${query}</strong>... 🔍</p>`;

  fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/JSON`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.json();
    })
    .then(data => {
      console.log(JSON.stringify(data, null, 2)); // For you to see the full response in console!

      const compound = data.PC_Compounds?.[0];
      if (!compound) {
        resultsDiv.innerHTML = `<p>No data found for "${query}". 🫥</p>`;
        return;
      }

      const props = compound.props || [];
      const molecularFormula = props.find(p => p.urn.label === 'Molecular Formula')?.value?.sval || 'N/A';
      const iupac = props.find(p => p.urn.label === 'IUPAC Name')?.value?.sval || 'N/A';
      const molWeight = props.find(p => p.urn.label === 'Molecular Weight')?.value?.sval || 'N/A';
      const boilingPoint = props.find(p => p.urn.label === 'Boiling Point')?.value?.sval || 'N/A';

      resultsDiv.innerHTML = `
        <h2>${query}</h2>
        <p><strong>Formula:</strong> ${molecularFormula}</p>
        <p><strong>IUPAC Name:</strong> ${iupac}</p>
        <p><strong>Molecular Weight:</strong> ${molWeight}</p>
        <p><strong>Boiling Point:</strong> ${boilingPoint}</p>
        <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.id.id.cid}/PNG" alt="Structure of ${query}">

        <p><em>More details coming soon! ✨</em></p>
        <a href="https://pubchem.ncbi.nlm.nih.gov/compound/${compound.id.id.cid}" target="_blank">View on PubChem 🔗</a>
      `;
    })
    .catch(error => {
      console.error(error);
      resultsDiv.innerHTML = `<p>Oops! Something went wrong. 🧯</p>`;
    });
});

// Camera search logic
const cameraBtn = document.getElementById('cameraBtn');
const imageInput = document.getElementById('imageInput');
const resultsDiv = document.getElementById('results');

if (cameraBtn && imageInput) {
  cameraBtn.addEventListener('click', () => {
    imageInput.value = '';
    imageInput.click();
  });

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resultsDiv.innerHTML = '<p>Analyzing image... <span style="font-size:1.2em">🔎</span></p>';
    try {
      const reader = new FileReader();
      reader.onload = async function(event) {
        const base64 = event.target.result.split(',')[1];
        const response = await fetch('http://localhost:5000/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (!response.ok) throw new Error('Vision API error');
        const data = await response.json();
        // Use textAnnotations for OCR results
        const textAnn = data.responses?.[0]?.textAnnotations;
        if (textAnn && textAnn.length && textAnn[0].description) {
          const detectedText = textAnn[0].description.trim().split(/\r?\n/)[0]; // Use the first line as chemical name
          resultsDiv.innerHTML = `<p>Detected text: <strong>${detectedText}</strong> <span style='font-size:1.2em'>🔎</span><br>Searching PubChem...</p>`;
          try {
            const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(detectedText)}/JSON`);
            if (!response.ok) throw new Error('No PubChem match');
            const data = await response.json();
            const compound = data.PC_Compounds?.[0];
            if (compound) {
              const props = compound.props || [];
              const molecularFormula = props.find(p => p.urn.label === 'Molecular Formula')?.value?.sval || 'N/A';
              const iupac = props.find(p => p.urn.label === 'IUPAC Name')?.value?.sval || 'N/A';
              const molWeight = props.find(p => p.urn.label === 'Molecular Weight')?.value?.sval || 'N/A';
              const boilingPoint = props.find(p => p.urn.label === 'Boiling Point')?.value?.sval || 'N/A';
              resultsDiv.innerHTML = `
                <h2>${detectedText} <span style='font-size:1.2em'>🔬</span></h2>
                <p><strong>Formula:</strong> ${molecularFormula}</p>
                <p><strong>IUPAC Name:</strong> ${iupac}</p>
                <p><strong>Molecular Weight:</strong> ${molWeight}</p>
                <p><strong>Boiling Point:</strong> ${boilingPoint}</p>
                <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.id.id.cid}/PNG" alt="Structure of ${detectedText}">
                <p><em>More details coming soon! ✨</em></p>
                <a href="https://pubchem.ncbi.nlm.nih.gov/compound/${compound.id.id.cid}" target="_blank">View on PubChem 🔗</a>
                <hr><p style='color:#aaa;font-size:.95em'>Matched by OCR text: <b>${detectedText}</b></p>
              `;
            } else {
              resultsDiv.innerHTML = `<p>No data found for "${detectedText}". 🫥</p>`;
            }
          } catch (e) {
            resultsDiv.innerHTML = `<p>No PubChem compound found for detected text: <strong>${detectedText}</strong></p>`;
          }
        } else {
          resultsDiv.innerHTML = '<p>No text detected in image.</p>';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      resultsDiv.innerHTML = `<p>Image search failed. <span style='color:#e57373'>${err.message}</span></p>`;
    }
  });
}
