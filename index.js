/***
 * Generate Keycloak realm representation
 * ex: node D:\Developpement\archi\all-modules\common-stuffs\project\keycloakRepresentation\index.js -u %USERNAME% -p xxx -s https://xxx:8443 -m xxx -o test.puml
 * open test.puml with platuml viewer
 */
const debug = require('debug')('keycloak')
const R = require('nunjucks')
const argv = require("yargs")(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .example('$0 -u %USERNAME% -p xxx -s https://localhost:8443 -m master -o master.puml', 'generate plantuml Keycloak realm representation')
    .alias('f', 'filter')
    .nargs('f', 1)
    .describe('f', 'Filter with regexp (unsensitive to case) Keycloak object by name')
    .alias('n', 'note')
    .nargs('n', 0)
    .describe('n', 'Generate notes with description')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'path of plantuml export')
    .alias('u', 'user')
    .nargs('u', 1)
    .describe('u', 'Keycloak user')
    .demandOption(['u'])
    .alias('p', 'password')
    .nargs('p', 1)
    .describe('p', 'Keycloak user\'s password')
    .demandOption(['p'])
    .alias('s', 'server')
    .nargs('s', 1)
    .describe('s', 'Keycloak server name')
    .demandOption(['s'])
    .alias('r', 'realm')
    .nargs('r', 1)
    .describe('r', 'Keycloak realm name to represent')
    .demandOption(['r'])
    .help('h')
    .alias('h', 'help')
    .argv

const fs = require('fs')
const request = require('sync-request');
const ResourceOwnerPassword = require('simple-oauth2').ResourceOwnerPassword;


let filterUnit = (data, attribute, regex) => data.filter(d => {
    let result=new RegExp(regex, "i").test(d[attribute])
    if(!result) debug('remove client',d[attribute])
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
    data.clients = filterUnit(data.clients,'clientId', regex)
}

const template = `
@startuml
class {{realm}} << (R,orchid) Realm >> {
}


{% for role in roles.realm %}
{% if 'offline_access' != role.name and 'uma_authorization'!= role.name and 'realm-management' != role.name %}
class "{{role.name}}" << (r,Chartreuse) Role >> {
    {static} scopeParamRequired: {{role.scopeParamRequired}}   
    {static} composite: {{role.composite}}  
}
"{{realm}}" *-- "{{role.name}}"
{% if role.description and note %}
note left: {{role.description}}
{% endif %}
{% endif %}
{% endfor %}

{% for roleC,detail in roles.client %}
{% if 'broker' != roleC and 'offline_access' != roleC and 'uma_authorization'!= roleC and 'realm-management' != roleC and 'account' != roleC%}
{% for role in detail %}
class "{{role.name}}" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired: {{role.scopeParamRequired}}   
    {static} composite: {{role.composite}}  
    {static} clientRole: {{role.clientRole}}  
}
"{{roleC}}" *-- "{{role.name}}"
{% if role.description and note %}note left: {{role.description}}{% endif %}
{% endfor %}
{% endif %}
{% endfor %}

{% for client in clients %}
{% if 'security-admin-console' != client.clientId and 'admin-cli' != client.clientId and  'broker' != client.clientId and 'account' != client.clientId and 'realm-management' != client.clientId %}
class "{{client.clientId}}" << (C,DarkSlateBlue) Client >> {
    {% if client.bearerOnly %} {static} bearerOnly: {{client.bearerOnly}}{% endif %}   
    {% if client.standardFlowEnabled %} {static} standardFlowEnabled: {{client.standardFlowEnabled}}{% endif %}
    {% if client.implicitFlowEnabled %} {static} implicitFlowEnabled: {{client.implicitFlowEnabled}}{% endif %}  
    {% if client.directAccessGrantsEnabled %} {static} directAccessGrantsEnabled: {{client.directAccessGrantsEnabled}}{% endif %}
    {% if client.serviceAccountsEnabled %} {static} serviceAccountsEnabled: {{client.serviceAccountsEnabled}}{% endif %} 
    {% if client.publicClient %} {static} publicClient: {{client.publicClient}}{% endif %}    
    {% if client.fullScopeAllowed %} {static} fullScopeAllowed: {{client.fullScopeAllowed}}{% endif %}   
    {% for cr in client.defaultRoles %}
    {static} role: {{cr}}
    {% endfor %}
    {% for scope,detail in clientScopeMappings %}
    {% for d in detail %}
    {% if client.clientId == d.client  %}
        __ scope __
        {% for r in d.roles %}
        {{scope}}.{{r}}
        {% endfor %}
    {% endif %}    
    {% endfor %}
    {% endfor %}
}    
{% if client.clientTemplate %}
class "{{client.clientTemplate}}" << (T,LightBlue) Template >> { 
}
"{{realm}}" *-- "{{client.clientTemplate}}"
"{{client.clientTemplate}}" <|-- "{{client.clientId}}"
{% endif %} 
"{{realm}}" *-- "{{client.clientId}}"
{% if client.description and note %}note left: {{client.description}}{% endif %}
{% endif %}
{% endfor %}

@enduml
`


const tokenParams = {
    username: argv.u || process.env.USERNAME,
    password: argv.p
};
let realm = argv.r || 'master'
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
        let puml = R.renderString(template, source).replace(/^\s*[\r\n]/gm, "")
        if (argv.o) {
            debug("Export enabled " + argv.o)
            fs.writeFileSync(argv.o, puml)
        }
        //debug(puml)
    }, (failure) => {
        console.error(failure)
    })