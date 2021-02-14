/***
 * Generate Keycloak realm representation
 * ex: node D:\Developpement\archi\all-modules\common-stuffs\project\keycloakRepresentation\index.js -u %USERNAME% -p xxx -s https://xxx:8443 -m xxx -o test.puml
 * open test.puml with platuml viewer
 */
const TEMPLATE_NAME = 'main.jinja2'
const debug = require('debug')('keycloak')
const R = require('nunjucks')
const argv = require('./params')
const fs = require('fs')
const request = require('sync-request');
const ResourceOwnerPassword = require('simple-oauth2').ResourceOwnerPassword;


let filterUnit = (data, attribute, regex) => data.filter(d => {
    let result = new RegExp(regex, "i").test(d[attribute])
    if (!result) debug('remove client', d[attribute])
    return result
})

let filter = (data, regex) => {
    data.roles.realm = filterUnit(data.roles.realm, 'name', regex)
    Object.keys(data.roles.client).forEach(c => {
        if (!new RegExp(regex, 'i').test(c)) {
            debug(`Remove client roles for ${c}`)
            delete data.roles.client[c]
        }
    })
    data.clients = filterUnit(data.clients, 'clientId', regex)
}

const tokenParams = {
    username: argv.u || process.env.USERNAME,
    password: argv.p
};
let realm = argv.r
if (!fs.existsSync(argv.t)) {
    console.error(`Template folder ${argv.t} not exist`)
    process.exit(1);
}

new ResourceOwnerPassword({
    client: {
        id: 'admin-cli',
        secret: ''
    },
    auth: {
        tokenHost: argv.s,
        tokenPath: `/auth/realms/master/protocol/openid-connect/token`
    }
}).getToken(tokenParams, {})
    .then((result) => {
        let token = result.token
        let access_token = token.access_token
        //console.log(access_token)
        let endpoint = `${argv.s}/auth/admin/realms/${realm}/partial-export?exportClients=true&exportGroupsAndRoles=true`
        let keycloak = request('POST', endpoint, {
            headers: {
                'Content-Type': 'application/json',
                authorization: 'Bearer ' + access_token

            },
        }).getBody().toString()

        let source = JSON.parse(keycloak)

        if (argv.n) {
            debug("Notes enabled")
            source.note = true
        }
        if (argv.f) {
            debug("Filter enabled " + argv.f)
            filter(source, argv.f)
        }

        source.legend = (argv.l == 'true')
        debug("Legend " + argv.l)

        R.configure(argv.t, {});
        let puml = R.render(TEMPLATE_NAME, source).replace(/^\s*[\r\n]/gm, "")
        if (argv.o) {
            debug("Export enabled " + argv.o)
            fs.writeFileSync(argv.o, puml)
        }
        //debug(puml)
    }, (failure) => {
        console.error(failure)
    })