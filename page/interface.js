window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("nextClassesBtn").addEventListener('click', () => {
        devQueryClasses(5, queriedClasses)
            .then(response => queryHandler.handleClassesQuery(response))
    })

    document.getElementById("getClassBtn").addEventListener('click', () => {
        let input = document.getElementById('classUriInput')
        devQueryClass(input.value)
            .then(response => queryHandler.handleClassesQuery(response))
    })
})


const displayProperties = {
    'uri': {
        label: 'URI:',
        getContent: (value) => {
            let el = document.createElement('a')
            el.href = value
            el.textContent = value
            return el
        }
    },
    'count': {
        label: 'Count:',
        getContent: (value) => {
            let el = document.createElement('div')
            el.textContent = Number(value).toLocaleString('en-US')
            return el
        }
    }
}


/**
 * Display information about clicked node and all outgoing links in the UI
 * @param {Object} node Node that was clicked
 * @param {Iterable} links node's outgoing links
 */
function displayNodeInfo(node, links) {
    displayNodeDetails(node)
    displayLinks(links)
}


/**
 * Display information about clicked link and all links of the same type in the UI
 * @param {Object} link Link that was clicked
 * @param {D3.Selection} allLinks containing all links in the visualisation
 */
function displayPathInfo(link, allLinks) {
    displayNodeDetails(link)
    displaySameLinks(link, allLinks)
}


/**
 * Display all links as outgoing links of a node
 * @param {Iterable} links
 */
function displayLinks(links) {
    const linksDiv = document.querySelector('#linksView')
    linksDiv.querySelector('.default').hidden = true
    linksDiv.querySelector('.title').textContent = 'Node Links'

    // Clear detail container of previous info
    const linksContainer = linksDiv.querySelector('.container')
    removeElementChildren(linksContainer)
    makeGridHeader(linksContainer, ['Property', 'Target', 'Count'])

    links.forEach(link => {
        makeLinkGridRow(linksContainer, [
            {elementType: 'a', textContent: getLabelFromURI(link.uri), href: link.uri},
            {elementType: 'a', textContent: getLabelFromURI(link.target), href: link.target},
            {elementType: 'div', textContent: Number(link.count).toLocaleString('en-US')},
        ])
    });
}


/**
 * Display all links that are the same as the selected link
 * @param {Object} link
 * @param {D3.Selection} allLinks D3
 */
function displaySameLinks(link, allLinks) {
    const linksDiv = document.querySelector('#linksView')
    linksDiv.querySelector('.default').hidden = true
    linksDiv.querySelector('.title').textContent = 'Same Links'

    // Clear detail container of previous info
    const linksContainer = linksDiv.querySelector('.container')
    removeElementChildren(linksContainer)
    makeGridHeader(linksContainer, ['Source', 'Target', 'Count'])

    allLinks.filter(l => l.uri === link.uri)
        .each(lnk => {
            makeLinkGridRow(linksContainer, [
                {elementType: 'a', textContent: getLabelFromURI(lnk.source), href: lnk.source},
                {elementType: 'a', textContent: getLabelFromURI(lnk.target), href: lnk.target},
                {elementType: 'div', textContent: Number(link.count).toLocaleString('en-US')},
            ])
        });
}


/**
 * Make a Bootstrap row containing the provided column content as cols
 * @param {HTMLElement} container new row will be appended here
 * @param {Iterable} columns {elementType, textContent, [href]}
 */
function makeLinkGridRow(container, columns) {
    let newLink = document.createElement('div')
    newLink.setAttribute('class', 'row text-wrap text-break my-3')

    columns.forEach(col => {
        let colElement = document.createElement(col.elementType)
        newLink.appendChild(colElement)
        colElement.setAttribute('class', 'col')
        colElement.textContent = col.textContent
        if(col.href) {
            colElement.href = col.href
        }
    })
    container.appendChild(newLink)
}


/**
 * Create a Bootstrap grid header with the provided header strings
 * @param {HTMLElement} container to append header to
 * @param {Iterable} headerStrings Strings of header cols
 */
function makeGridHeader(container, headerStrings) {
    let header = document.createElement('div')
    header.setAttribute('class', 'row')

    headerStrings.forEach(headerStr => {
        let element = document.createElement('strong')
        header.appendChild(element)
        element.setAttribute('class', 'col')
        element.textContent = headerStr
    })
    container.appendChild(header)
}


function displayNodeDetails(node) {
    const detailDiv = document.getElementById('detailView')

    detailDiv.querySelector('.title').textContent = node.label
    detailDiv.querySelector('.default').hidden = true

    // Clear detail container of previous info
    const detailContainer = detailDiv.querySelector('.container')
    removeElementChildren(detailContainer)

    // Create info elements for desired properties
    for(var property in node) {
        if(displayProperties.hasOwnProperty(property)) {
            makePropertyRow(detailContainer, node[property], displayProperties[property])
        }
    }
}


function makePropertyRow(container, property, typeInfo) {
    let newRow = document.createElement('div')
    let typeEl = document.createElement('strong')
    let contentEl = typeInfo.getContent(property)

    newRow.setAttribute('class', 'row')
    typeEl.setAttribute('class', 'col-2 p-0')
    contentEl.setAttribute('class', 'col-10 text-wrap text-break')

    typeEl.textContent = typeInfo.label

    newRow.appendChild(typeEl)
    newRow.appendChild(contentEl)
    container.appendChild(newRow)
}


function removeElementChildren(element) {
    while(element.hasChildNodes()) {
        element.removeChild(element.firstChild)
    }
}
