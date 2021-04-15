/***
 * Generate Keycloak realm representation
 * ex: node D:\Developpement\archi\all-modules\common-stuffs\project\keycloakRepresentation\index.js -u %USERNAME% -p xxx -s https://xxx:8443 -m xxx -o test.puml
 * open test.puml with platuml viewer
 */
const debug = require('debug')('rkeycloak')
const argv = require('./params')
const fs = require('fs')
const request = require('sync-request');
const ResourceOwnerPassword = require('simple-oauth2').ResourceOwnerPassword;
const RENDER = require('./render')

RENDER.checkInstall()

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

let getRoles=(host,access_token,id)=>{
    let suser = JSON.parse(request('GET', `${host}/auth/admin/realms/${realm}/clients/${id}/service-account-user`, {
        headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer ' + access_token

        },
    }).getBody().toString())

    return JSON.parse(request('GET', `${host}/auth/admin/realms/${realm}/users/${suser.id}/role-mappings`, {
        headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer ' + access_token

        },
    }).getBody().toString())
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

        source.skipRoles = argv.k
        debug("skipRoles " + argv.k)

        if(!source.skipRoles){
            source.clients.forEach(c => {
                if (c.serviceAccountsEnabled) c.additionalRoles=getRoles(argv.s,access_token,c.id)
            });
        }

        debug(JSON.stringify(source))
        RENDER.render(argv, source)
    }, (failure) => {
        console.error(failure)
    })