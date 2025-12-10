const fs = require("fs");
const topojson = require("topojson-client");
const d3 = require("d3-geo");

async function main() {
    const topo = JSON.parse(fs.readFileSync("states.json", "utf8"));

    const states = topojson.feature(topo, topo.objects.states);
    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    const path = d3.geoPath(projection);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="97" height="610">`;

    states.features.forEach(f => {
        const id = f.id;
        const d = path(f);
        svg += `<path id="${id}" d="${d}" fill="#ccc" stroke="#333" stroke-width="0.5"></path>`;
    });

    svg += `</svg>`;

    fs.writeFileSync("us-states.svg", svg);
    console.log("DONE → us-states.svg generated");
}

main();