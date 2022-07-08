const testQuery = `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
SELECT DISTINCT ?poskytovatel ?datova_sada ?nazev
WHERE {
    GRAPH ?g {
        ?datova_sada a dcat:Dataset; dct:title ?nazev;
        dct:publisher/foaf:name ?poskytovatel.
    }
}
LIMIT 100
`

const pathQuery = `
SELECT ?a ?p ?b (COUNT(*) AS ?count)
WHERE { [ a ?a ] ?p [ a ?b ] . }
GROUP BY ?a ?p ?b`

const pathQuery2 = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?t1 ?p (COUNT(*) AS ?total)
WHERE {
    ?s ?p ?o .
    ?s a ?t1 .
    ?o a dcat:Dataset .
    FILTER (?p != rdfs:subClassOf && ?p != rdf:type && ?p != rdfs:range && ?p != rdfs:domain)
}
GROUP BY ?t1 ?p`

function getClassesQuery(offset) {
    return `
    SELECT DISTINCT ?class (COUNT(*) AS ?instanceCount)
    WHERE {
        ?s a ?class
    }
    ORDER BY DESC(?instanceCount)
    LIMIT 20
    OFFSET ${offset}`
}

function getClassPropertiesQuery(classURI) {
    return `
    SELECT DISTINCT ?property ?targetClass (COUNT(1) AS ?instanceCount)
    WHERE {
        ?class a <${classURI}> .
        ?target a ?targetClass .
        ?class ?property ?target
    }
    ORDER BY DESC(?instanceCount)
    LIMIT 20
    `
}

function getClassLinksQuery(class1URI, class2URI) {
    return `
    SELECT DISTINCT ?property (COUNT(*) AS ?instanceCount)
    WHERE {
        ?class1 a <http://www.w3.org/ns/dqv#QualityMeasurement> .
        ?class2 a <http://www.w3.org/ns/dcat#Distribution> .
        ?class2 ?property ?class1 .
    }
    `
}


window.addEventListener('DOMContentLoaded', () => {
    main();
});


function main() {
    const urlParams = new URLSearchParams(window.location.search);
    let endpointURL = urlParams.get('endpoint');
    document.getElementById("helloHeader").textContent += endpointURL;

    queryEndpoint(endpointURL, getClassesQuery(0))
        .then(response => handleClassesQuery(response))
        .then(visData => makeVisGraph(visData))
        .then(visData => queryClassProperties(visData))
        .then(visData => testAddLinks(visData))
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAddLinks(visData) {
    await sleep(3000)
    visData.links.push({
        'source': "http://www.w3.org/ns/dcat#Distribution",
        'target': "http://www.w3.org/ns/dcat#Dataset",
        'id': "http://www.example.com/testProperty",
        'label': "testProperty",
        'count': 1000
    })
    makeVisGraph(visData)
    await sleep(3000)
    visData.links.push({
        'source': "http://www.w3.org/ns/dcat#Dataset",
        'target': "http://purl.org/linked-data/cube#Observation",
        'id': "http://www.example.com/testProperty",
        'label': "testProperty",
        'count': 10000
    })
    makeVisGraph(visData)
    return visData
}

async function queryClassProperties(visData) {
    if(!visData.hasOwnProperty('links')) {
        visData['links'] = []
    }

    visData.links.push({
        'source': "http://www.w3.org/ns/dcat#Distribution",
        'target': "http://www.w3.org/ns/dqv#QualityMeasurement",
        'id': "http://www.w3.org/ns/dqv#hasQualityMeasurement",
        'label': "hasQualityMeasurement",
        'count': 481602
    })
    visData.links.push({
        'source': "http://www.w3.org/ns/dqv#QualityMeasurement",
        'target': "http://www.w3.org/ns/dcat#Distribution",
        'id': "http://www.w3.org/ns/dqv#computedOn",
        'label': "computedOn",
        'count': 481614
    })
    return makeVisGraph(visData);
}


/**
 * Format class query response
 * @param {JSON} response
 * @returns Object of processed response items
 */
async function handleClassesQuery(response) {
    let knownClasses = [];
    response.results.bindings.forEach(element => {
        knownClasses.push({
            'id': element.class.value,
            'count': element.instanceCount.value,
            'label': getLabelFromURI(element.class.value)
        });
    });
    return {'classes': knownClasses};
}


/**
 * Query the SPARQL endpoint with the given query and handle results
 * @param {URL} endpoint
 * @param {string} query
 * @returns JSON response content promise
 */
async function queryEndpoint(endpoint, query) {
    let queryURL = endpoint + '?query=' + encodeURIComponent(query);
    queryURL += '&format=application%2Fsparql-results%2Bjson';

    return fetch('testresult.json')
        .then(data=>data.json())
    // return fetch(queryURL)
    //     .then(data=>data.json())
}


async function makeVisGraph(visData) {
    let copyVisData = {...visData}
    updateForceVis(copyVisData)
    return visData
}


function getLabelFromURI(uri) {
    let slashLast = uri.split('/').slice(-1)[0];  // get last element inplace
    let hashLast = uri.split('#').slice(-1)[0];
    return slashLast.length < hashLast.length ? slashLast : hashLast;
}