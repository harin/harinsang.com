// Initialize Firebase
var config = {
    apiKey: "AIzaSyAaqhsAXdlA7WeoaPWuZL98X3Hc9djYSBc",
    authDomain: "harrrin-ae638.firebaseapp.com",
    databaseURL: "https://harrrin-ae638.firebaseio.com",
    projectId: "harrrin-ae638",
    storageBucket: "harrrin-ae638.appspot.com",
    messagingSenderId: "815618362493"
};

firebase.initializeApp(config);

var database = firebase.database();
var sessionStartTime = new Date()
var sess = {}
var data = []

function dateToKey(date) {
    return date.toISOString().substring(0, 19) // remove milliseconds
}

function registerSession() {
    setInterval(() => {
        let time = dateToKey(new Date())
        const currentTimeRef = database.ref(`sessions/${time}`)
        currentTimeRef.transaction(function(count) {
            if (count) {
                return count + 1
            }
            return 1
        })
    }, 1000) // 10 seconds

}

function retrievePreviousSection() {
    database.ref('sessions').limitToLast(60)
        .on('value', function(snapshot) {
            snapshot.forEach(child => {
                sess[child.key] = child.val()
            })
            setupData()
            updateData()
        })
}

function setupData() {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 1) // wait for data to stabilize
    const times = Array(60).fill(1).map((_, i) => {
        const pre = new Date(now)
        pre.setSeconds(pre.getSeconds() - i)
        return pre
    })

    data = times.map((d) => {
        const key = dateToKey(d)
        const val = sess[key] || 0
        return { key, val }
    }).reverse()
    // console.log('data', data)
}

var svg = null
const margin = {
    top: 10,
    bottom: 30,
    left: 0,
    right: 0
}

function setupD3() {
    svg = d3.select('body')
        .append('svg')
            .attr('id', 'session-count')
            .attr('width', window.innerWidth)
            .attr('height', window.innerHeight/4)
}

function updateData() {
    const xScale = d3.scaleLinear()
        .domain([0, 60])
        .range([margin.left + 0, Number(svg.attr('width')) - margin.right])

    const maxCount = d3.max(data, d => d.val)

    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([Number(svg.attr('height')) - margin.bottom, 0 + margin.top])

    const line = d3.line()
        .x((d,i) => xScale(i))
        .y(d => yScale(d.val))
        .curve(d3.curveBasis)

    let ref = svg.selectAll('path')
        .data([data])

        ref = ref.enter()
            .append('path')
                .attr('d', line)
                .style('fill', 'none')
                .style('stroke', 'black')
        .merge(ref)

        ref.transition()
            .delay(1000)
            .duration(100)
                .attr('d', line)
                .attr('transform', `translate(0, 0)`)
                .style('stroke', 'black')

    let text = svg.selectAll('text')
        .data([data[data.length-1]])

    text.enter()
        .append('text')
            .style('font-family', 'Raleway')
            .style('font-size', '20')
        .merge(text)
            .attr('x', svg.attr('width') - 15)
            .attr('y', (d) => {
                return yScale(d.val) + 10
            })
            .html(d => d.val)
    

        


        
}

function resizeSVG() {
    svg.attr('width', window.innerWidth)
        .attr('height', window.innerHeight/4)
    updateData()
}

registerSession()
retrievePreviousSection()
setupData()
document.addEventListener('DOMContentLoaded', function(event) { 
    setupD3()
    updateData()
    window.addEventListener('resize', function(event) {
        resizeSVG()
    })
})





