const TEMPLATE_NAME = 'main.jinja2'
const debug = require('debug')('rkeycloak')
const R = require('nunjucks')
const plantuml = require('node-plantuml-latest')
const path = require('path')
const fs = require('fs')

let replaceEmptyLine = (line) => line.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "")

let renderUnit = (output, puml) => {
    if (output) {
        debug(`Export enabled ${output}`)
        if (output === true) {
            //let gen = plantuml.generate(puml,{ format: 'ascii' })
            //gen.out.pipe(process.stdout)
            console.log(puml)
        }
        else if (path.extname(output) === '.puml') fs.writeFileSync(output, puml)
        else {
            let gen = plantuml.generate(puml)
            gen.out.pipe(fs.createWriteStream(output))
        }
    }
}

let checkInstall = () => {
    let dot = plantuml.testdot()
    let result = '';
    dot.out.on('data', function (chunk) {
        result += chunk;
    })

    dot.out.on('end', function () {
        if (result.includes('No dot executable found')) {
            console.warn('GRAPHVIZ not installed. Only sequence diagrams will be generated')
        }
    });
}

let render = (argv, source) => {
    R.configure(argv.t, {});
    let puml = replaceEmptyLine(R.render(TEMPLATE_NAME, source))
    if (Array.isArray(argv.o)) {
        argv.o.forEach(o => {
            renderUnit(o, puml)
        })
    } else {
        renderUnit(argv.o, puml)
    }
}

module.exports = {
    checkInstall: checkInstall,
    render: render
}

