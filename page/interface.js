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


function displayNodeInfo(node, links) {
    displayNodeDetails(node)
    displayLinks(links)
}


function displayPathInfo(link) {
    displayNodeDetails(link)
}


function displayLinks(links) {
    const linksDiv = document.querySelector('#linksView')
    linksDiv.querySelector('.default').hidden = true

    // Clear detail container of previous info
    const linksContainer = linksDiv.querySelector('.container')
    removeElementChildren(linksContainer)
    makeLinkGridHeader(linksContainer)

    links.forEach(link => {
        makeLinkGridRow(linksContainer, link)
    });
}


function makeLinkGridRow(container, link) {
    let newLink = document.createElement('div')
    let propertyURI = document.createElement('a')
    let targetURI = document.createElement('a')
    let count = document.createElement('div')
    newLink.appendChild(propertyURI)
    newLink.appendChild(targetURI)
    newLink.appendChild(count)
    newLink.setAttribute('class', 'row text-wrap text-break my-3')

    targetURI.setAttribute('class', 'col')
    targetURI.textContent = link.target.label
    targetURI.href = link.target.id

    propertyURI.textContent = link.label
    propertyURI.href = link.id
    propertyURI.setAttribute('class', 'col')

    count.textContent = Number(link.count).toLocaleString('en-US')
    count.setAttribute('class', 'col')

    container.appendChild(newLink)
}


function makeLinkGridHeader(container) {
    let header = document.createElement('div')
    let property = document.createElement('strong')
    let target = document.createElement('strong')
    let count = document.createElement('strong')
    header.appendChild(property)
    header.appendChild(target)
    header.appendChild(count)

    header.setAttribute('class', 'row')

    target.setAttribute('class', 'col')
    target.textContent = 'Target'
    property.setAttribute('class', 'col')
    property.textContent = 'Property'
    count.setAttribute('class', 'col')
    count.textContent = 'Count'

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
