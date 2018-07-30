let ratio = 0.4;
let textContent = "There are days which occur in this climate, at almost any season of the year, wherein the world reaches its perfection, when the air, the heavenly bodies, and the earth, make a harmony, as if nature would indulge her offspring; when, in these bleak upper sides of the planet, nothing is to desire that we have heard of the happiest latitudes, and we bask in the shining hours of Utah and Colorado; when everything… that has life gives sign of satisfaction, and the cattle that lie on the ground seem to have great and tranquil thoughts.";

let svg = d3.select("body").append("svg")
  .attr("id", "uxSVGContainer")
  .attr('viewBox', '0 0 1000 1000');


let jsonSquares = [{
  "x": 30,
  "y": 30,
  "width": 375,
  "height": 667,
  "color": "rgba(255, 255, 255)",
  "stroke": "rgba(199, 199, 199, 0.5019607843137255)",
  "strokeWidth": 1
},
{
  "x": 30,
  "y": 30,
  "width": 375,
  "height": 667,
  "color": "rgba(255, 255, 255)"
}
];

var jsonTexts = [{
  "text": textContent,
  "x": 60,
  "y": 30 - 215 + 585,
  "fontSize": 16,
  "width": 302,
  "height": 267,
  "fontFamily": "Georgia",
  "fill": "rgb(44, 44, 44)"
}];

var rectangles = svg
  .selectAll("rect")
  .data(jsonSquares)
  .enter()
  .append("rect");

var rectangleAttributes = rectangles
  .attr("x", d => d.x * ratio)
  .attr("y", d => d.y * ratio)
  .attr("width", d => d.width * ratio)
  .attr("height", d => d.height * ratio).attr("stroke", d => d.stroke)
  .attr("stroke-width", d => Math.ceil(d.strokeWidth * ratio))
  .style("fill", d => d.color);


function addTextRect(svg, props, ratio) {
  let fo = svg.append('foreignObject');
  fo.attr('x', props.x * ratio)
    .attr('y', props.y * ratio)
    .attr('width', props.width * ratio)
    .attr('height', props.height * ratio);

  let div = fo.append('xhtml:div').append('div');
  let parag = div.append('p');
  $(parag.node()).css({
    'font-size': (Math.round(props.fontSize * 1000 * ratio / 16) / 1000) + 'em',
    'font-family': props.fontFamily
  })
    .html(props.text);
  var foHeight = div.node().getBoundingClientRect().height;
  fo.attr({
    'height': foHeight
  });
}
//addTextRect(svg, jsonTexts[0], ratio);

window.minX = 0;
window.minY = 0;
window.maxX = 0;
window.maxY = 0;
function getOffset(json, ratio, parentOffset) {
  parentOffset = parentOffset || { x: 0, y: 0 };

  let tx = json.transform && json.transform.tx || 0;
  let ty = json.transform && json.transform.ty || 0;

  let result = {
    x: (30 + tx + parentOffset.x) * ratio,
    y: (30 + ty + parentOffset.y) * ratio
  };

  window.minX = Math.min(window.minX, result.x);
  window.minY = Math.min(window.minY, result.y);
  window.maxX = Math.max(window.maxX, result.x);
  window.maxY = Math.max(window.maxY, result.y);

  return result;
}

function getColor(json) {
  if (json.mode === 'RGB') {
    if (json.alpha !== undefined) {
      return `rgba(${json.value.r}, ${json.value.g}, ${json.value.b}, ${json.alpha})`;
    }
    return `rgb(${json.value.r}, ${json.value.g}, ${json.value.b})`;
  }

  return 'red';
}

function renderArtElementText(svg, ratio, json, parentOffset) {
  let fontSize = (Math.round(json.style.font.size * 1000 * ratio / 16) / 1000) + 'em';
  let text = json.text.rawText;
  let idx = 0;
  let offset = getOffset(json, ratio, parentOffset);
  json.text.paragraphs.forEach(p => {
    p.lines.forEach(l => {
      l.forEach(part => {
        svg.append('text')
          .attr('id', json.id + '__' + (idx++))
          .attr('x', offset.x + (part.x * ratio))
          .attr('y', offset.y + (part.y * ratio))
          .attr('font-size', fontSize)
          .attr('font-family', json.style.font.family)
          .attr('font-style', json.style.font.style === 'Italic' ? 'italic' : 'normal')
          .attr('font-weight', json.style.font.style === 'Bold' ? 'bold' : 'normal')
          .attr('fill', getColor(json.style.fill.color))
          .text(text.substring(part.from, part.to));

      })
    });
  });
}

function setStroke(element, style, ratio) {
  if (!style || !style.stroke || style.stroke.type === 'none') {
    return;
  }

  element
    .attr('stroke', getColor(style.stroke.color))
    .attr('stroke-width', style.stroke.width * ratio);

  return element;
}

function setTransform(element, json, ratio) {

  if (!json.transform) {
    return;
  }

  let transform = element.attr('transform');
  if (json.transform.a === 1 && json.transform.d === 1) {
    return;
  }
  if (json.transform.b === 1 && json.transform.c === -1) {
    element.attr('transform', transform + ' rotate(90)')
  }
}

let imgIdx = 1;
function setFill(element, style, svg, ratio) {
  if (!style || !style.fill || !style.fill.type === 'none') {
    return;
  }

  let fill = style.fill;

  switch (fill.type) {
    case 'solid':
      element.attr('style', 'fill: ' + getColor(fill.color));
      break;

    case 'pattern':
      /*
        <defs>
        <pattern id="img1" patternUnits="userSpaceOnUse" width="100" height="100">
          <image xlink:href="wall.jpg" x="0" y="0" width="100" height="100" />
        </pattern>
        </defs>
        */
      let pattern = svg.append('defs').append('pattern');
      pattern.attr('id', 'img' + imgIdx);
      pattern.attr('preserveAspectRatio', 'xMidYMid slice');
      pattern.attr('width', '100%');
      pattern.attr('height', '100%');
      pattern.attr('viewBox', `0 0 ${fill.pattern.width} ${fill.pattern.height}`)

      let meta = fill.pattern.meta;
      let image = pattern.append('image');
      image.attr('xlink:href', '/resources/' + meta.ux.uid);
      image.attr('x', 0);
      image.attr('y', 0);
      image.attr('width', fill.pattern.width);
      image.attr('height', fill.pattern.height);

      element.attr('fill', 'url(#img' + imgIdx + ')')
      imgIdx++;
      break;

    default:
      element.attr('fill', 'transparent');
      break;
  }

  return element;
}

function renderArtElementShape(svg, ratio, json, parentOffset) {
  let shape = json.shape;
  let offset = getOffset(json, ratio, parentOffset);
  let element = null;

  switch (shape.type) {
    case 'line':
      // <line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
      element = svg.append('line')
        .attr('id', json.id)
        .attr('x1', offset.x + (shape.x1 * ratio))
        .attr('y1', offset.y + (shape.y1 * ratio))
        .attr('x2', offset.x + (shape.x2 * ratio))
        .attr('y2', offset.y + (shape.y2 * ratio));
      break;
    case 'rect':
      // <image xlink:href="firefox.jpg" x="0" y="0" height="50px" width="50px"/>
      element = svg.append('rect')
        .attr('id', json.id)
        .attr('x', offset.x + (shape.x * ratio))
        .attr('y', offset.y + (shape.y * ratio))
        .attr('width', shape.width * ratio)
        .attr('height', shape.height * ratio);
      break;

    case 'circle':
      // <circle xmlns="http://www.w3.org/2000/svg" class="bd" cx="3.5" cy="3.5" r="3.5"/>
      element = svg.append('circle')
        .attr('id', json.id)
        .attr('cx', offset.x + (shape.cx * ratio))
        .attr('cy', offset.y + (shape.cy * ratio))
        .attr('r', shape.r * ratio);
      break;

    case 'path':
      element = svg.append('path')
        .attr('id', json.id)
        .attr('transform', `translate(${offset.x},${offset.y}) scale(${ratio} ${ratio})`)
        .attr('d', shape.path);
      break;
  }

  if (element) {
    setTransform(element, json, ratio);
    setStroke(element, json.style, ratio);
    setFill(element, json.style, svg, ratio);
  }
}

function renderArtElement(svg, ratio, json, parentOffset) {

  if (!json || !json.type) {
    return;
  }

  switch (json.type) {
    case 'text':
      renderArtElementText(svg, ratio, json, parentOffset);
      break;

    case 'shape':
      renderArtElementShape(svg, ratio, json, parentOffset);
      break;

    case 'group':
      let groupOffset = {
        x: json.transform.tx,
        y: json.transform.ty
      };
      if (parentOffset) {
        groupOffset.x += parentOffset.x;
        groupOffset.y += parentOffset.y;
      }
      json.group.children.forEach(el => renderArtElement(svg, ratio, el, groupOffset));
      break;
  }
}

function displayArtboard(svg, ratio, artboard) {
  let json = {
    "type": "shape",
    "id": "artboard",
    "transform": { "a": 1, "b": 0, "c": 0, "d": 1, "tx": 0, "ty": 0 },
    "style": {
      "fill": {
        "type": "solid",
        "color": {
          "mode": "RGB",
          "value": {
            "r": 255,
            "g": 255,
            "b": 255
          }
        }
      },
      "stroke": {
        "type": "solid",
        "color": {
          "mode": "RGB",
          "value": {
            "r": 149,
            "g": 152,
            "b": 154
          }
        },
        "width": 1,
        "align": "inside"
      }
    },
    "shape": {
      "type": "rect",
      "x": artboard.x,
      "y": artboard.y,
      "width": artboard.width,
      "height": artboard.height
    }
  };

  renderArtElementShape(svg, ratio, json);
}

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

// let resources = [
//   '/artwork/artboard-3d78c015-7b0e-43d4-9d9e-c7e294886097/graphics/graphicContent.agc',
//   '/artwork/artboard-9e91fdba-8f78-4dec-bf14-a05eea2e2c62/graphics/graphicContent.agc'
// ];
// resources.forEach(resourceUrl => {
//   httpGetAsync(resourceUrl, data => {
//     let json = JSON.parse(data);
//     json = json.children[0].artboard.children;
//     json.forEach(el => renderArtElement(svg, ratio, el));

//     if (++calls == resources.length) {
//       let minX = window.minX;
//       let minY = window.minY;
//       let width = window.maxX - window.minX + 500;
//       let height = window.maxY - window.minY + 500;

//       svg.attr('viewBox', `${minX} ${minY} ${width} ${height}`);
//     }
//   });
// });

httpGetAsync('/resources/graphics/graphicContent.agc', data => {
  let json = JSON.parse(data);
  Object.keys(json.resources.clipPaths).forEach(key => {
    let value = json.resources.clipPaths[key];
    value.children.forEach(el => renderArtElement(svg, ratio, el));
  });

  Object.keys(json.artboards).forEach(key => {
    let artboard = json.artboards[key];
    displayArtboard(svg, ratio, artboard);
  })
});

let calls = 0;
httpGetAsync('/manifest.json', data => {
  let json = JSON.parse(data);
  let artboard = json.children[0].children;
  json = artboard.forEach(element => {
    if (element.path.startsWith('artboard-')) {
      httpGetAsync('/artwork/' + element.path + '/graphics/graphicContent.agc', data => {
        let json = JSON.parse(data);
        json = json.children[0].artboard.children;
        json.forEach(el => renderArtElement(svg, ratio, el));

        if (++calls == artboard.length) {
          let minX = window.minX;
          let minY = window.minY;
          let width = window.maxX - window.minX + 500;
          let height = window.maxY - window.minY + 500;

          svg.attr('viewBox', `${minX} ${minY} ${width} ${height}`);
        }
      });
    } else {
      calls++;
    }
  });
});