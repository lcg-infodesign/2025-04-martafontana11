let data;               // variabile per il dataset
let img;                // immagine della mappa di sfondo
let volcanoes = [];     // array che conterrà i dati dei vulcani elaborati
let hoverRadius = 8;    // raggio per rilevare il mouse sopra ogni glifo

// variabili per pagina dettaglio
let detailMode = false;       // indica se siamo nella pagina di dettaglio
let selectedVolcano = null;   // contiene il vulcano cliccato


// dimensioni e posizione della mappa e della legenda
let mapWidth, mapHeight, mapX, mapY;
let padding = 10;
let titleHeight = 130;
let legendWidth, legendX, legendY;

function preload() {
  // carica il dataset e l'immagine 
  data = loadTable("data.csv", "csv", "header");
  img = loadImage("mappa.png");
}

function setup() {
  let maxWidth = 1200;
  let canvasWidth = min(windowWidth, maxWidth);
  createCanvas(canvasWidth, 1000);
  noLoop();               // disegna solo su eventi (per ottimizzare)
  background("#ffffff");  // sfondo bianco iniziale

  // calcola dimensioni e posizioni per la mappa e legenda
  mapWidth = width * 0.8;
  mapHeight = height - titleHeight - 40;
  mapX = padding;
  mapY = titleHeight;

  legendWidth = width * 0.15 - 2 * padding;
  legendX = mapX + mapWidth + padding;
  legendY = titleHeight;

  // ciclo per processare ogni riga del dataset
  for (let i = 0; i < data.getRowCount(); i++) {
    let lat = data.getNum(i, "Latitude");
    let lon = data.getNum(i, "Longitude");
    let type = data.getString(i, "TypeCategory");
    let name = data.getString(i, "Volcano Name");
    let country = data.getString(i, "Country");
    let type_volcano = data.getString(i, "Type");
    let elevation = data.getString(i, "Elevation (m)");
    // pagina di dettaglio
    let lastEruption = data.getString(i, "Last Known Eruption");

    // esclude dati mancanti o non validi
    if (isNaN(lat) || isNaN(lon) || !type) continue;

    // converte coordinate geografiche in pixel per la posizione sulla mappa
    let pos = geoToPixel(lat, lon);

    // memorizza dati vulcano per disegno e interazione
    volcanoes.push({
      x: pos.x,
      y: pos.y,
      name,
      country,
      elevation,
      type,
      type_volcano,
      latitude: lat,
      longitude: lon,
      lastEruption,     
      });

  }
}

function draw() {
  background(255);  // sfondo bianco ad ogni frame

  // se siamo in modalità dettaglio, disegno solo quella pagina
  if (detailMode && selectedVolcano) {
  drawDetailPage(selectedVolcano);
  return;
  } 

  // titolo e descrizioni sopra la mappa
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(26);
  fill(0);
  noStroke();
  text("Mappa globale dei vulcani", width / 2 * 0.8, 40);

  textStyle(NORMAL);
  textSize(14);
  text("Esercitazione 4: partendo dal dataset, generare una visione esplorativa e una visione di dettaglio.", width / 2 * 0.8, 70);
  text("Il glifo rappresenta le variabili della categoria e dell'altezza dei vulcani: Clicca su un vulcano per scoprire maggiori informazioni!.", width / 2 * 0.8, 90);

  // immagine mappa con bordo
  image(img, mapX, mapY, mapWidth, mapHeight);
  stroke(0);
  noFill();
  rect(mapX, mapY, mapWidth, mapHeight);

  // un glifo per ogni vulcano sulla mappa
  for (let v of volcanoes) {
    drawGlyph(v.x, v.y, v.type, v.elevation);
  }

  // se il mouse è vicino a un vulcano, mostra tooltip con info
  for (let v of volcanoes) {
    if (dist(mouseX, mouseY, v.x, v.y) < hoverRadius) {
      drawTooltip(v);
      break;  // mostra solo tooltip di un vulcano alla volta
    }
  }

  // legenda verticale sulla destra
  drawVerticalLegend();

  drawFooter();

}

function mouseMoved() {
  redraw();  // aggiorna il disegno quando il mouse si muove
}

function mousePressed() {
  if (!detailMode) {
    // se non sono in dettaglio: controllo click sui glifi
    for (let v of volcanoes) {
      if (dist(mouseX, mouseY, v.x, v.y) < hoverRadius) {
        selectedVolcano = v;
        detailMode = true;
        redraw();
        break;
      }
    }
  } else {
    // se sono in dettaglio: controllo click su "Back to map"
    if (mouseX > 20 && mouseX < 200 && mouseY > 20 && mouseY < 50) {
      detailMode = false;
      selectedVolcano = null;
      redraw();
    }
  }
}


function drawGlyph(x, y, type, elevation) {
  push();
  translate(x, y);
  noStroke();

  // assegna colore in base alla categoria del vulcano
  switch (type) {
    case "Stratovolcano": fill(240, 76, 60); break;
    case "Cone": fill(243, 156, 18); break;
    case "Caldera": fill(155, 89, 184); break;
    case "Crater System": fill(52, 137, 219); break;
    case "Maars / Tuff ring": fill(26, 188, 156); break;
    case "Shield Volcano": fill(46, 204, 113); break;
    case "Submarine Volcano": fill(52, 40, 94); break;
    case "Other / Unknown": fill(245, 245, 245); break;
  }

  // scala l'altezza del triangolo in base all'elevazione del vulcano
  let h = map(parseFloat(elevation), -6000, 6879, 1, 12);

  // triangolo che rappresenta il vulcano
  triangle(-6, 6, 6, 6, 0, -h);
  pop();
}

function drawDetailPage(v) {
  background(255); // sfondo bianco

  // Pulsante BACK
  
  fill(0);
  noStroke();
  rect(60, 30, 140, 35, 4);
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("← Back to map", 75, 48);

  // legenda a sinistra
  let oldLegendX = legendX;   // salva la posizione originale
  legendX = padding + 50;           // sposta la legenda a sinistra
  drawVerticalLegend();

  // informazioni dettagliate del vulcano
  let infoX = legendX + legendWidth + 40;
  let infoY = 130;

  fill(0);
  textAlign(LEFT, TOP);
  textSize(28);
  textStyle(BOLD);
  text(v.name, infoX, infoY);

  textStyle(NORMAL);
  textSize(15);

  let yy = infoY + 50;
  text(`Country: ${v.country}`, infoX, yy); yy += 24;
  text(`Latitude: ${v.latitude}`, infoX, yy); yy += 24;
  text(`Longitude: ${v.longitude}`, infoX, yy); yy += 24;
  text(`Elevation: ${v.elevation} m`, infoX, yy); yy += 24;
  text(`Type: ${v.type_volcano}`, infoX, yy); yy += 24;
  text(`Category: ${v.type}`, infoX, yy); yy += 24;
  text(`Last Known Eruption: ${v.lastEruption}`, infoX, yy);
 
 legendX = oldLegendX;       // ripristina la posizione originale così quando torno alla mappa è al posto giusto

 // glifo grande del vulcano selezionato
  drawDetailGlyph(v);

  // timeline dell'ultima eruzione
  drawTimeline(v);

  drawFooter();
  
}


function drawDetailGlyph(v) {
  let gx = width - 500 ;   // posizione orizzontale del glifo grande
  let gy = 200;           // posizione verticale

  push();
  translate(gx, gy);
  noStroke();

  // Colori identici ai glifi piccoli
  switch (v.type) {
    case "Stratovolcano": fill(240, 76, 60); break;
    case "Cone": fill(243, 156, 18); break;
    case "Caldera": fill(155, 89, 184); break;
    case "Crater System": fill(52, 137, 219); break;
    case "Maars / Tuff ring": fill(26, 188, 156); break;
    case "Shield Volcano": fill(46, 204, 113); break;
    case "Submarine Volcano": fill(52, 40, 94); break;
    default: fill(200);
  }

  // glifo scala con altezza del vulcano
  let h = map(parseFloat(v.elevation), -6000, 6879, 20, 180);

  triangle(-90, 90, 90, 90, 0, 90 - h);
  pop();
}


function drawTooltip(v) { 
  // appare quando si passa sopra il glifo di un vulcano
  // dimensioni e posizione del riquadro tooltip, evita uscita dal bordo
  let w = 190;
  let h = 110;
  let tx = v.x + 10;
  let ty = v.y + 10;

  if (tx + w > mapX + mapWidth) tx = v.x - w - 10;
  if (tx < 0) tx = 10;
  if (ty + h > height) ty = v.y - h - 10;
  if (ty < 0) ty = 10;

  // sfondo e bordo tooltip
  fill(0, 180);
  stroke(0);
  rect(tx, ty, w, h, 5);

  // testo con informazioni del vulcano
  fill(255);
  noStroke();
  textSize(10);
  textAlign(LEFT, TOP);
  text(`Name: ${v.name}`, tx + 10, ty + 10);
  text(`Type: ${v.type_volcano}`, tx + 10, ty + 30);
  text(`Elevation: ${v.elevation} m`, tx + 10, ty + 60);
  text(`Country: ${v.country}`, tx + 10, ty + 80);
}

function drawVerticalLegend() {
  // riquadro della legenda
  let rectX = legendX;
  let rectY = legendY;
  let rectW = legendWidth;
  let rectH = mapHeight;

  fill(220);
  stroke(150);
  rect(rectX, rectY, rectW, rectH, 5);

  // elenco dei tipi di vulcano con colori corrispondenti
  let types = [
    { label: "Cone", color: [243, 156, 18] },
    { label: "Caldera", color: [155, 89, 184] },
    { label: "Crater System", color: [52, 137, 219] },
    { label: "Maars / Tuff ring", color: [26, 188, 156] },
    { label: "Shield Volcano", color: [46, 204, 113] },
    { label: "Stratovolcano", color: [240, 76, 60] },
    { label: "Submarine Volcano", color: [52, 40, 94] },
    { label: "Other / Unknown", color: [245, 245, 245] }
  ];

  let spacingY = 30; // stessa spaziatura per categorie ed elevation
  let startY = rectY + 30;

  // Categorie titolo
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Categories:", rectX + 5, rectY + 10);

  // Disegna ogni tipo con triangolo e label
  for (let i = 0; i < types.length; i++) {
    let y = startY + i * spacingY;
    fill(types[i].color);
    triangle(rectX + 5, y + 8, rectX + 17, y + 8, rectX + 11, y - 4);
    fill(0);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(types[i].label, rectX + 25, y + 2);
  }

  // Elevation titoloS
  let elevations = [-6000, -4000, -2000, 0, 2000, 4000, 6000, 6879];
  let elevationStartY = startY + types.length * spacingY + 20; // piccolo gap tra sezioni

  fill(0);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("Elevation (m):", rectX + 5, elevationStartY - 20);

  for (let i = 0; i < elevations.length; i++) {
    let y = elevationStartY + i * spacingY;
    let h = map(elevations[i], -6000, 6879, 1, 12);
    fill(170);
    triangle(rectX + 5, y + 8, rectX + 17, y + 8, rectX + 11, y - h);
    fill(0);
    textSize(11);
    textAlign(LEFT, CENTER);
    text(`${elevations[i]} m`, rectX + 25, y + 2);
  }
}


function geoToPixel(lat, lon) {
  let x = map(lon, -180, 180, mapX + padding, mapX + mapWidth - padding);
  let y = map(lat, 90, -90, mapY + padding, mapY + mapHeight - padding);
  return { x, y };

}


function drawTimeline(selected) {
  let code = selected.lastEruption;  // codice dell'eruzione del vulcano
  let codes = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "U", "Q", "?"];
  let baseX = 265;  // posizione orizzontale della timeline
  let baseY = 450; // posizione verticale della timeline
  let spacing = 100; // distanza tra i punti della timeline

  codes.reverse();   // inverte l'ordine per visualizzare D1 a sinistra

  // linea base della timeline
  stroke(0);       // linea nera
  strokeWeight(2);
  line(baseX, baseY, baseX + (codes.length - 1) * spacing, baseY);

  // disegno dei punti e del codice sotto ciascun punto
  textSize(12);
  textAlign(CENTER);
  for (let i = 0; i < codes.length; i++) {
    let x = baseX + i * spacing;
    noStroke();
    fill(0); // punti neri
    ellipse(x, baseY, 5, 5);
    fill(0); // testo nero
    text(codes[i], x, baseY + 25);
  }

  // evidenzia il vulcano selezionato con un puntino rosso
  let idx = codes.indexOf(code);
  if (idx !== -1) {
    let x = baseX + idx * spacing;
    fill("red");
    noStroke();
    ellipse(x, baseY, 16, 16);
  }


  // titolo della timeline
  push();
  fill(0); // testo nero
  textAlign(LEFT);
  textStyle(BOLD);
  textSize(26);
  text("Last Known Eruption Timeline", baseX, baseY - 60);
  pop();

  // legenda della timeline
  push();
  fill(0); // testo nero
  textAlign(LEFT);
  textSize(14);
  text("D1  Last known eruption 1964 or later", baseX, baseY + 80);
  text("D2  Last known eruption 1900-1963", baseX, baseY + 100);
  text("D3  Last known eruption 1800-1899", baseX, baseY + 120);
  text("D4  Last known eruption 1700-1799", baseX, baseY + 140);
  text("D5  Last known eruption 1500-1699", baseX, baseY + 160);
  text("D6  Last known eruption A.D. 1-1499", baseX, baseY + 180);
  text("D7  Last known eruption B.C. (Holocene)", baseX, baseY + 200);
  text("U   Undated, but probable Holocene eruption", baseX, baseY + 220);
  text("Q   Quaternary eruption(s) only; hydrothermal", baseX, baseY + 240);
  text("?   Uncertain Holocene eruption", baseX, baseY + 260);
  pop();
}


function drawFooter() {
  let footerHeight = 30;

  fill(240);
  noStroke();
  rect(0, height - footerHeight, width, footerHeight);

  fill(0);
  textSize(12);

  textAlign(LEFT, CENTER);
  text("Marta Fontana", padding, height - footerHeight / 2);

  textAlign(RIGHT, CENTER);
  text("Laboratorio di Computer Grafica per l’Information Design / A.A. 2025-2026",
       width - padding, height - footerHeight / 2);
}
