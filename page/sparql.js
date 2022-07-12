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


var queryHandler
var queriedClasses = 0;


function main() {
    const urlParams = new URLSearchParams(window.location.search);
    let endpointURL = urlParams.get('endpoint');
    document.getElementById("helloHeader").textContent += endpointURL;
    queryHandler = new QueryHandler()

    // queryEndpoint(endpointURL, getClassesQuery(0))
    devQueryClasses(5, queriedClasses)
        .then(response => {
            queriedClasses += response.length
            queryHandler.handleClassesQuery(response)
        })

}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    return updateVisGraph(visData);
}


class QueryHandler {
    visData = {
        'classes': {},
        'links': [],
    }


    /**
     * Format class query response
     * @param {JSON} response
     * @returns Object of processed response items
     */
    handleClassesQuery = function(response) {
        response.forEach(element => {
            let newClass = {
                'id': element.class.value,
                'count': element.instanceCount.value,
                'label': getLabelFromURI(element.class.value)
            }
            // request links to existing classes before new one is added
            this.requestNewLinks(newClass)
            this.visData['classes'][element.class.value] = newClass
        })
        updateVisGraph(this.visData)
    }


    handleLinksQuery = function(response) {
        this.visData.links.push(...response)
        updateVisGraph(this.visData)
    }


    requestNewLinks = function(newClass) {
        let classesCopy = {...this.visData.classes}
        for(let cls in classesCopy) {
            devQueryLink(newClass.id, cls)
                .then(r => this.handleLinksQuery(r))
            devQueryLink(cls, newClass.id)
                .then(r => this.handleLinksQuery(r))
        }
    }
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

    return fetch(queryURL)
        .then(data=>data.json())
}


async function updateVisGraph(visData) {
    let copyVisData = {...visData}
    updateForceVis(copyVisData)
    return visData
}


function getLabelFromURI(uri) {
    let slashLast = uri.split('/').slice(-1)[0];  // get last element inplace
    let hashLast = uri.split('#').slice(-1)[0];
    return slashLast.length < hashLast.length ? slashLast : hashLast;
}