window.addEventListener('DOMContentLoaded', () => {
})


const displayProperties = {
    'id': {
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
    },
    'properties': {
        label: 'Properties:',
        getContent: (value) => {
            let el = document.createElement('div')
            el.textContent = Number(value).toLocaleString('en-US')
            return el
        }
    },
}


function displayInfo(event, node, links) {
    const detailDiv = document.getElementById('detailView')
    console.log(node)
    console.log(event)
    console.log(links)

    detailDiv.querySelector('.title').textContent = node.label
    detailDiv.querySelector('.default').hidden = true

    // Clear detail container of previous info
    const detailContainer = detailDiv.querySelector('.detailContainer')
    while(detailContainer.hasChildNodes()) {
        detailContainer.removeChild(detailContainer.firstChild)
    }

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
    typeEl.setAttribute('class', 'col-2')
    contentEl.setAttribute('class', 'col-10 text-wrap text-break')

    typeEl.textContent = typeInfo.label

    newRow.appendChild(typeEl)
    newRow.appendChild(contentEl)
    container.appendChild(newRow)
}
