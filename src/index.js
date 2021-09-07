function getData() {
    return new Promise((res) => {
        setTimeout(() => {
            res({ id: Math.random().toString().substr(2, 16) })
        }, 2000)
    })
}

async function run() {
    let dataStream = []
    for (let i = 0; i < 4; i++) {
        const data = getData()
        dataStream.push(data)
    }

    let s = await Promise.all(dataStream)
    for (let i = 0; i < s.length; i++) {
        console.log(s[i])
    }
}

run().catch((e) => console.log(e.message))
