TEST LOCALLY: 
- clone project 
- npm install 
- sudo npm link
- galaxy

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/galaxy.svg)](https://npmjs.org/package/galaxy)
[![Downloads/week](https://img.shields.io/npm/dw/galaxy.svg)](https://npmjs.org/package/galaxy)
[![License](https://img.shields.io/npm/l/galaxy.svg)](https://github.com/ERASE2020/galaxy/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g galaxycli
$ galaxy COMMAND
running command...
$ galaxy (-v|--version|version)
galaxycli/0.11.0 darwin-x64 node-v10.15.1
$ galaxy --help [COMMAND]
USAGE
  $ galaxy COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`galaxy application [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]`](#galaxy-application-createlistupdatearchiveviewdelete)
* [`galaxy autocomplete [SHELL]`](#galaxy-autocomplete-shell)
* [`galaxy change-password`](#galaxy-change-password)
* [`galaxy datasource [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]`](#galaxy-datasource-createlistupdatearchiveviewdelete)
* [`galaxy deployment [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]`](#galaxy-deployment-createlistupdatearchiveviewdeletedeploydestroystatus)
* [`galaxy help [COMMAND]`](#galaxy-help-command)
* [`galaxy login`](#galaxy-login)
* [`galaxy logout`](#galaxy-logout)
* [`galaxy namespace`](#galaxy-namespace)
* [`galaxy policy [CREATE/LIST/UPDATE/ARCHIVE/VIEW/IMPLEMENTATION/DELETE]`](#galaxy-policy-createlistupdatearchiveviewimplementationdelete)
* [`galaxy secrets [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]`](#galaxy-secrets-createlistupdatearchiveviewdeletedeploydestroystatus)
* [`galaxy target-account [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CREDENTIALS/DELETE]`](#galaxy-target-account-createlistupdatearchiveviewcredentialsdelete)
* [`galaxy workload [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CLONE/DELETE]`](#galaxy-workload-createlistupdatearchiveviewclonedelete)

## `galaxy application [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]`

Actions on applications

```
USAGE
  $ galaxy application [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]

OPTIONS
  -d, --description=description  provide a description to update/create an app
  -f, --file=file                provide a json file representing an app
  -h, --help                     show CLI help
  -i, --id=id                    provide an app id
  -n, --name=name                provide a name to update/create an app
  -t, --type=type                provide a type to update/create an app. Ex: NPM, JAR
```

_See code: [src/commands/application.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/application.ts)_

## `galaxy autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ galaxy autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ galaxy autocomplete
  $ galaxy autocomplete bash
  $ galaxy autocomplete zsh
  $ galaxy autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.4/src/commands/autocomplete/index.ts)_

## `galaxy change-password`

change your password

```
USAGE
  $ galaxy change-password

OPTIONS
  -h, --help                     show CLI help
  -n, --newPassword=newPassword  new password
  -p, --oldPassword=oldPassword  old password
```

_See code: [src/commands/change-password.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/change-password.ts)_

## `galaxy datasource [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]`

Actions relative to datasource(s)

```
USAGE
  $ galaxy datasource [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE]

OPTIONS
  -d, --description=description  provide a description to update/create a datasource
  -f, --file=file                provide a json file representing a datasource
  -h, --help                     show CLI help
  -i, --id=id                    provide a datasource id
  -n, --name=name                provide a name to update/create a datasource
  -t, --type=type                provide a type to update/create a datasource. Ex: DOCKER, GITHUB, JFROG, DOCKER
  -u, --url=url                  provide an url for the repository address
```

_See code: [src/commands/datasource.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/datasource.ts)_

## `galaxy deployment [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]`

Actions on deployment(s)

```
USAGE
  $ galaxy deployment [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]

OPTIONS
  -c, --computationImplementationId=computationImplementationId  provide an implementation. Ex: gcp-computeEngine
  -d, --deploypackId=deploypackId                                provide a deploypack id
  -d, --description=description                                  provide a description to update/create a deployment
  -f, --file=file                                                provide a json file representing a deployment
  -h, --help                                                     show CLI help
  -i, --id=id                                                    provide a deployment id
  -n, --name=name                                                provide a name to update/create a deployment
  -t, --targetAccountId=targetAccountId                          provide a target account id
  -w, --workloadId=workloadId                                    provide a workload id
```

_See code: [src/commands/deployment.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/deployment.ts)_

## `galaxy help [COMMAND]`

display help for galaxy

```
USAGE
  $ galaxy help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `galaxy login`

Log in to a galaxy cluster

```
USAGE
  $ galaxy login

OPTIONS
  -h, --help               show CLI help
  -n, --ns=ns              provide namespace id
  -p, --password=password  provide password
  -t, --target=target      provide endpoint
  -u, --email=email        provide email
```

_See code: [src/commands/login.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/login.ts)_

## `galaxy logout`

Log out safely

```
USAGE
  $ galaxy logout

OPTIONS
  -f, --force
  -h, --help   show CLI help

EXAMPLE
  $ galaxy logout
  Disconnecting the user...bye bye
```

_See code: [src/commands/logout.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/logout.ts)_

## `galaxy namespace`

Select a different namespace

```
USAGE
  $ galaxy namespace

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/namespace.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/namespace.ts)_

## `galaxy policy [CREATE/LIST/UPDATE/ARCHIVE/VIEW/IMPLEMENTATION/DELETE]`

Actions on custom policies

```
USAGE
  $ galaxy policy [CREATE/LIST/UPDATE/ARCHIVE/VIEW/IMPLEMENTATION/DELETE]

OPTIONS
  -a, --impAdd                   dependent of [IMPLEMENTATION] command. Indicates you wanna add an implementation
  -d, --description=description  provide a description to create/update a policy
  -f, --file=file                provide a json file representing a policy
  -h, --help                     show CLI help
  -i, --id=id                    provide a policy id
  -n, --name=name                provide a name to create/update a policy

  -p, --impProvider=impProvider  dependent of --impAdd or --impUpdate command. Indicates the provider of the
                                 implementation

  -r, --impRemove                dependent of [IMPLEMENTATION] command. Indicates you wanna remove an implementation

  -u, --impUpdate                dependent of [IMPLEMENTATION] command. Indicates you wanna update an implementation
```

_See code: [src/commands/policy.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/policy.ts)_

## `galaxy secrets [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]`

Actions on deployment(s)

```
USAGE
  $ galaxy secrets [CREATE/LIST/UPDATE/ARCHIVE/VIEW/DELETE/DEPLOY/DESTROY/STATUS]

OPTIONS
  -c, --computationImplementationId=computationImplementationId  provide an implementation. Ex: gcp-computeEngine
  -d, --deploypackId=deploypackId                                provide a deploypack id
  -d, --description=description                                  provide a description to update/create a deployment
  -f, --file=file                                                provide a json file representing a deployment
  -h, --help                                                     show CLI help
  -i, --id=id                                                    provide a deployment id
  -n, --name=name                                                provide a name to update/create a deployment
  -t, --targetAccountId=targetAccountId                          provide a target account id
  -w, --workloadId=workloadId                                    provide a workload id
```

_See code: [src/commands/secrets.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/secrets.ts)_

## `galaxy target-account [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CREDENTIALS/DELETE]`

Actions on target accounts

```
USAGE
  $ galaxy target-account [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CREDENTIALS/DELETE]

OPTIONS
  -c, --credentials=credentials  provide a json file representing the user credentials. Depends on [Credentials]
  -d, --description=description  provide a description to create/update a target account
  -f, --file=file                provide a json file representing a target-account
  -h, --help                     show CLI help
  -i, --id=id                    provide a targetAccount id
  -n, --name=name                provide a name to create/update a target account
  -p, --provider=provider        give a provider name to create/update a target account
```

_See code: [src/commands/target-account.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/target-account.ts)_

## `galaxy workload [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CLONE/DELETE]`

Actions on workload(s)

```
USAGE
  $ galaxy workload [CREATE/LIST/UPDATE/ARCHIVE/VIEW/CLONE/DELETE]

OPTIONS
  -c, --completion=completion    provide a completion percentage to create/update a workload
  -d, --description=description  provide a description to create/update a workload
  -f, --file=file                provide a json file representing a workload
  -h, --help                     show CLI help
  -i, --id=id                    provide a workload id
  -n, --name=name                provide a name to create/update a workload
```

_See code: [src/commands/workload.ts](https://github.com/Darillium/kitlings/blob/v0.11.0/src/commands/workload.ts)_
<!-- commandsstop -->
