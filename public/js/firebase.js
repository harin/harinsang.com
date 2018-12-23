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
        currentTimeRef.transaction(function (count) {
            if (count) {
                return count + 1
            }
            return 1
        })
    }, 1000) // 1 seconds
}

function retrievePreviousSection() {
    database.ref('sessions').limitToLast(60)
        .once('value', function (snapshot) {
            snapshot.forEach(child => {
                sess[child.key] = child.val()
            })
            setupData()
            const lastKey = data[data.length - 1].key
            const sessRef = database.ref('sessions')
                .orderByKey()
                .startAt(lastKey)
                sessRef.on('child_added', (snapshot) => {
                    sess[snapshot.key] = snapshot.val()
                    // console.log('added', snapshot.key, snapshot.val())
                })
                sessRef.on('child_changed', (snapshot) => {
                    // console.log('update', snapshot.key, snapshot.val())
                    sess[snapshot.key] = snapshot.val()
                })
        })
}


function setupData() {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 1) // wait for data to stabilize

    // initialize data
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
}

var svg = null
const margin = {
    top: 30,
    bottom: 30,
    left: 0,
    right: 0
}

var xScale = null
var yScale = null
var path = null
var line = null
var text = null

function setupD3() {
    svg = d3.select('body')
        .append('svg')
        .attr('id', 'session-count')

    path = svg.append('g')
        .append('path')
            .datum(data)
            .attr('id', 'session-line')

    line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.val))
        .curve(d3.curveNatural)
    
    text = d3.select('body')
        .append('div')
        .attr('id', 'viewing-label')

    resizeSVG()
}

function resizeSVG() {
    svg.attr('width', window.innerWidth)
        .attr('height',170)

    xScale = d3.scaleLinear()
        .domain([0, 60])
        .range([margin.left + 0, Number(svg.attr('width')) + 40 - margin.right])

    yScale = d3.scaleLinear()
        .domain([0, 2])
        .range([Number(svg.attr('height')) - margin.bottom, 0 + margin.top])



}

registerSession()
retrievePreviousSection()

var duration = 1000

document.addEventListener('DOMContentLoaded', function (event) {
    setupD3()
    window.addEventListener('resize', function (event) {
        resizeSVG()
    })

    setInterval(() => {
        const key = dateToKey(new Date())
        let val = sess[key]
        if (!val) {
            console.log('cant find', val, key, sess[key])
            val = 0
        }

        data.push({ key, val })

        text.html(`${val} viewing`)

        yScale.domain([0, d3.max(data, d => d.val)])

        svg.select('#session-line')
            .datum(data)
            .attr('d', line)
            .attr('transform', null)

        path.interrupt()
            .transition()
            .ease(d3.easeLinear)
            .duration(duration)
            .attr('transform', `translate(${xScale(-1)})`)

        data = data.slice(data.length - 60, data.length)
    }, duration)
})





