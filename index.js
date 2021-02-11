/***
 * Generate Keycloak realm representation
 * ex: node D:\Developpement\archi\all-modules\common-stuffs\project\keycloakRepresentation\index.js -u %USERNAME% -p xxx -s https://xxx:8443 -m xxx -o test.puml
 * open test.puml with platuml viewer
 */
const R = require('nunjucks')
const argv = require('yargs').argv;
const fs = require('fs')
//let keycloak = JSON.parse(fs.readFileSync('./monetique.json'))
const request = require('sync-request');
const ResourceOwnerPassword = require('simple-oauth2').ResourceOwnerPassword;

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
let realm = argv.m
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

        let source=JSON.parse(keycloak)
        
        if(argv.n){
            source.note=true
        }

        let puml = R.renderString(template,source ).replace(/^\s*[\r\n]/gm, "")
        if (argv.o) {
            fs.writeFileSync(argv.o, puml)
        }
        console.log(puml)
    }, (failure) => {
        console.error(failure)
    })