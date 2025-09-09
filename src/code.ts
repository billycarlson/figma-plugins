import products from './products.json'; // Line 1

figma.showUI(__html__, { width: 300, height: 300 }); // Line 3

// Load all Noto Sans font styles we use // Line 5
async function loadNotoSansVariants() { // Line 6
  const styles: FontStyle[] = ["Light", "Regular", "Medium", "SemiBold", "Bold"]; // Line 7
  const promises = styles.map(style => // Line 8
    figma.loadFontAsync({ family: "Noto Sans", style }) // Line 9
  ); // Line 10
  await Promise.all(promises); // Line 11
  console.log("All Noto Sans variants loaded"); // Line 12
} // Line 13
loadNotoSansVariants(); // Line 14

function getRandomProduct(category: string) { // Line 16
  const filtered = category === 'random' // Line 17
    ? products // Line 18
    : products.filter(p => p.category === category); // Line 19
  const index = Math.floor(Math.random() * filtered.length); // Line 20
  return filtered[index]; // Line 21
} // Line 22

function getFilteredProducts(category: string) { // Line 24
  return category === 'random' ? products : products.filter(p => p.category === category); // Line 25
} // Line 26

async function populateCard(node: FrameNode, product: any) { // Line 28
  console.log("🛠️ Populating card:", node.name); // Line 29
  const findText = (name: string) => node.findOne(n => n.type === 'TEXT' && n.name === name) as TextNode | null; // Line 30
  const findImage = (name: string) => node.findOne(n => n.type === 'RECTANGLE' && n.name === name) as RectangleNode | null; // Line 31

  const allTextNames = [ // Line 33
    'Brand Name', 'Product Name', 'Form Factor', 'Quantity', 'Rating', // Line 34
    'Reviews', 'Sold Info', 'Sold Price', 'Unit Price' // Line 35
  ]; // Line 36

  await Promise.all(allTextNames.map(async name => { // Line 38
    const textNode = findText(name); // Line 39
    if (textNode) { // Line 40
      await figma.loadFontAsync(textNode.fontName as FontName); // Line 41
    } // Line 42
  })); // Line 43

  const mapping = { // Line 45
    'Brand Name': product.brand, // Line 46
    'Product Name': product.name, // Line 47
    'Form Factor': product.formFactor, // Line 48
    'Quantity': product.quantity, // Line 49
    'Rating': String(product.rating), // Line 50
    'Reviews': String(product.reviews), // Line 51
    'Sold Info': product.soldInfo, // Line 52
    'Sold Price': product.price, // Line 53
    'Unit Price': product.unitPrice // Line 54
  }; // Line 55

  for (const [name, value] of Object.entries(mapping)) { // Line 57
    const textNode = findText(name); // Line 58
    if (textNode) { // Line 59
      textNode.characters = value; // Line 60
    } else { // Line 61
      console.log(`❌ Could not find text layer: ${name}`); // Line 62
    } // Line 63
  } // Line 64

  try { // Line 66
    const imageBytes = await fetch(product.image).then(res => res.arrayBuffer()); // Line 67
    const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash; // Line 68
    const rect = findImage('Product Image'); // Line 69
    if (rect) { // Line 70
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }]; // Line 71
    } else { // Line 72
      console.log("❌ Could not find Product Image rectangle"); // Line 73
    } // Line 74
  } catch (err) { // Line 75
    console.error('Image load error:', err); // Line 76
  } // Line 77
} // Line 78

figma.ui.onmessage = async msg => { // Line 80
  console.log('📩 Received message:', msg); // Line 81

  if (msg.type === 'fill') {
  console.log('⚡ Fill Selected triggered');
  const selection = figma.currentPage.selection;
  console.log(`🧮 Selected nodes: ${selection.length}`);

  // Add this to see what was selected
  console.log('🔎 Selection types:');
  selection.forEach(node => {
    console.log(`- ${node.name}: ${node.type}`);
  });

  const nodes = selection.filter(n =>
    n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE'
  ) as FrameNode[];

  console.log(`🖼️ Frames found: ${nodes.length}`);

  for (const node of nodes) {
    const product = getRandomProduct('random');
    await populateCard(node, product);
  }
}


  if (msg.type === 'generate') { // Line 101
    const template = figma.currentPage.selection[0] as FrameNode; // Line 102
    if (!template) { // Line 103
      figma.notify('Select a card to duplicate.'); // Line 104
      return; // Line 105
    } // Line 106

    const filtered = getFilteredProducts('random'); // Line 108
    const count = Math.min(filtered.length, 20); // Line 109
    const nodes: FrameNode[] = []; // Line 110
    const columns = 4; // Line 111
    const spacingX = template.width + 40; // Line 112
    const spacingY = template.height + 40; // Line 113

    for (let i = 0; i < count; i++) { // Line 115
      const product = filtered[i]; // Line 116
      const clone = template.clone(); // Line 117
      const col = i % columns; // Line 118
      const row = Math.floor(i / columns); // Line 119

      clone.x = template.x + col * spacingX; // Line 121
      clone.y = template.y + spacingY + row * spacingY; // Line 122

      figma.currentPage.appendChild(clone); // Line 124
      await populateCard(clone, product); // Line 125
      nodes.push(clone); // Line 126
    } // Line 127

    figma.currentPage.selection = nodes; // Line 129
    figma.viewport.scrollAndZoomIntoView(nodes); // Line 130
  } // Line 131
}; // Line 132
