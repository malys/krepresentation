
# Keycloak-graphical-representation

The main goal of this project is to generate quick representation of realm configuration based on plantuml.
This service would make easier understanding and conception of authentication process with Keycloak.


```
@startuml
class master << (R,orchid) Realm >> {
}
class "admin" << (r,Chartreuse) Role >> {
    {static} scopeParamRequired:    
    {static} composite: true  
}
"master" *-- "admin"
class "create-realm" << (r,Chartreuse) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
}
"master" *-- "create-realm"
class "manage-events" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-events"
class "query-clients" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "query-clients"
class "manage-realm" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-realm"
class "create-client" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "create-client"
class "view-identity-providers" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "view-identity-providers"
class "view-realm" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "view-realm"
class "manage-users" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-users"
class "view-clients" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: true  
    {static} clientRole: true  
}
"master-realm" *-- "view-clients"
class "impersonation" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "impersonation"
class "manage-clients" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-clients"
class "manage-authorization" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-authorization"
class "view-authorization" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "view-authorization"
class "query-groups" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "query-groups"
class "view-users" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: true  
    {static} clientRole: true  
}
"master-realm" *-- "view-users"
class "view-events" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "view-events"
class "manage-identity-providers" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "manage-identity-providers"
class "query-realms" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "query-realms"
class "query-users" << (r,GreenYellow) Role >> {
    {static} scopeParamRequired:    
    {static} composite: false  
    {static} clientRole: true  
}
"master-realm" *-- "query-users"
class "account-console" << (C,DarkSlateBlue) Client >> {
     {static} standardFlowEnabled: true
     {static} publicClient: true    
        __ scope __
        account.manage-account
}    
"master" *-- "account-console"
class "master-realm" << (C,DarkSlateBlue) Client >> {
     {static} bearerOnly: true   
     {static} standardFlowEnabled: true
     {static} fullScopeAllowed: true   
}    
"master" *-- "master-realm"
@enduml
```


## Table of Contents
<details><summary>display</summary>

- [Keycloak-graphical-representation](#keycloak-graphical-representation)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Usage](#usage)
  - [Versioning](#versioning)
  - [Changelog](#changelog)
    - [0.1.0 (Work in progress)](#010-work-in-progress)
  - [TODO](#todo)
  - [Authors](#authors)

</details>

## Prerequisites

* Node >=12
* [Keycloak](https://www.keycloak.org)
* Plantuml viewer ([vscode](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml))

## Installing

```
npm install
```

## Usage

```
node index.js -u {{user}} -p {{password}} -s {{keycloak server url}} -m {{realm name}} -o {{realm name}}.puml
```
example:
```
docker run --rm -d  -p 8180:8080 -e KEYCLOAK_USER=keycloak -e KEYCLOAK_PASSWORD=keycloak jboss/keycloak
node index.js -u keycloak -p keycloak -s http://localhost:8180 -m master -o master.puml
code master.puml
```

## Versioning

We use [SemVer](http://semver.org/) for versioning. 

## Changelog

### 0.1.0 (Work in progress)

* Manage roles, realm, client
* Filter default clients and roles


## TODO

* Create a standalone version
* Improve roles management
* Add options to filter default clients and roles

## Authors

Malys