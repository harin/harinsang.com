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
    return date.toISOString().substring(0, 16) // remove seconds
}

function registerSession() {
    let time = dateToKey(sessionStartTime)

    const currentTimeRef = database.ref(`sessions/${time}`)
    currentTimeRef.transaction(function(count) {
        if (count) {
            return count + 1
        }
        return 1
    })
}

function retrievePreviousSection() {
    database.ref('sessions').limitToLast(60)
        .once('value', function(snapshot) {
            snapshot.forEach(child => {
                sess[child.key] = child.val()
            })
            setupData()
            plotData()
        })
}

function setupData() {
    const times = Array(60).fill(1).map((_, i) => {
        const pre = new Date(sessionStartTime)
        pre.setMinutes(pre.getMinutes() - i)
        return pre
    })

    data = times.map((d) => {
        const key = dateToKey(d)
        const val = sess[key] || 0
        return { key, val }
    })
}

var svg = null

function setupD3() {
    svg = d3.select('body')
        .append('svg')
            .attr('id', 'session-count')
            .attr('width', window.innerWidth)
            .attr('height', window.innerHeight)
}

function plotData() {
    const xScale = d3.scaleLinear()
        .domain([0, 60])
        .range([0, Number(svg.attr('width'))])

    const maxCount = d3.max(data, d => d.val)

    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([Number(svg.attr('height')), 0])

    const line = d3.line()
        .x((d,i) => xScale(i))
        .y(d => yScale(d.val))
    svg.append('path')
        .attr('d', line(data))
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-wdith', 5)
}

registerSession()
retrievePreviousSection()
setupData()

document.addEventListener("DOMContentLoaded", function(event) { 
    setupD3()
    plotData()
})



