"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const login_1 = require("./login");
const inquirer = require("inquirer");
// @ts-ignore
const node_persist_1 = require("node-persist");
const index_1 = require("../index");
const axios_1 = require("axios");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const workload_1 = require("./workload");
const target_account_1 = require("./target-account");
const notifier = require("node-notifier");
const cli_ux_1 = require("cli-ux");
class Deployment extends command_1.Command {
    constructor() {
        super(...arguments);
        this.deployments = [];
        this.selectedEntity = {};
        this.userObject = {};
    }
    async run() {
        const { args, flags } = this.parse(Deployment);
        if (await login_1.alreadyLoggedIn()) {
            let userChoice = {};
            if (!Object.values(args).find(a => a)) {
                userChoice = await this.localMenu();
            }
            await this.actionManager(userChoice);
        }
        else {
            this.error('you are not logged in...');
        }
    }
    async destroyDeployment(targetId) {
        const { args, flags } = this.parse(Deployment);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token },
            params: {
                'deploymentId': targetId
            }
        };
        cli_ux_1.cli.action.start('initiating destroy deployment...A notification will be sent once the process is complete');
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/executions/scripts/execute`, config).then((res) => {
            console.log(chalk_1.default.green.bold(`The deployment ${this.selectedEntity['name']} ${this.selectedEntity['id']} is destroyed/undeployed`));
            cli_ux_1.cli.action.stop();
            notifier.notify({
                title: `Destroying ${this.selectedEntity['name'] || flags.id}`,
                message: `Destroyed ${this.selectedEntity['id']}  !!!`
            });
        }).catch(error => {
            cli_ux_1.cli.action.stop();
            notifier.notify({
                title: `Destroying ${this.selectedEntity['name'] || flags.id}`,
                message: `Could not destroy ${this.selectedEntity['id'] || flags.id}...`
            });
            if (this.selectedEntity['status'] !== 'DEPLOY_SUCCEEDED') {
                this.error("A deployment cannot be destroyed unless it is deployed. " + chalk_1.default.bold.red(`Cannot deploy because status = ${this.selectedEntity['status'] || null}`));
            }
            else if (error['response']['data']['errorClass'] === 'io.darillium.timelords.exception.TargetPlatformNotSupportedException') {
                notifier.notify({
                    title: `Destroying ${this.selectedEntity['name'] || flags.id}`,
                    message: `FAILED. Target platform ${this.selectedEntity['targetAccountView']['name']} 
           ${this.selectedEntity['targetAccountView']['id']} not supported ...`
                });
                this.error(`Catched error on destroying deployment.` + chalk_1.default.bold.red(`Target platform ${this.selectedEntity['targetAccountView']['name']} ${this.selectedEntity['targetAccountView']['id']} is not supported`));
            }
            else {
                notifier.notify({
                    title: `Destroying ${this.selectedEntity['name'] || flags.id}`,
                    message: `FAILED. ${error['response']['data']['errorClass']}`
                });
                this.error(`Catched error on destroying deployment ${this.selectedEntity['id'] || flags.id}`);
            }
        });
    }
    async deployTarget(targetId) {
        const { args, flags } = this.parse(Deployment);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token },
            params: {
                'deploymentId': targetId
            }
        };
        cli_ux_1.cli.action.start('initiating deploy deployment...A notification will be sent once the process is complete');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/executions/scripts/execute`, config).then((res) => {
            console.log(chalk_1.default.green.bold(`Congratulations! You deployed:  ${this.selectedEntity['id']}`));
            cli_ux_1.cli.action.stop();
            notifier.notify({
                title: `Deploying ${this.selectedEntity['name'] || flags.id}`,
                message: `Deployment ${this.selectedEntity['id']} successful !!!`
            });
        }).catch(error => {
            cli_ux_1.cli.action.stop();
            if (this.selectedEntity['status'] !== 'SCRIPT_GENERATION_SUCCEEDED'
                || this.selectedEntity['status'] !== 'DEPLOY_FAILED' || this.selectedEntity['status'] !== 'DEPLOY_SUCEEDED') {
                notifier.notify({
                    title: `Deploying ${this.selectedEntity['name'] || flags.id}`,
                    message: `Cannot deploy because status = ${this.selectedEntity['status'] || null}`
                });
                this.error("The stage of this deployment's status is too early. " + chalk_1.default.bold.red(`Cannot deploy because status = ${this.selectedEntity['status'] || null}`));
            }
            else {
                notifier.notify({
                    title: `Deploying ${this.selectedEntity['name'] || flags.id}`,
                    message: `${error['data']['errorClass']}`
                });
                this.error(`Catched error on deploying deployment ${this.selectedEntity['id'] || flags.id}`);
            }
        });
    }
    async getDeploymentStatus(targetId) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('getting deployment status');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`VIEW deployment status: ${res['data']['status']}`));
            cli_ux_1.cli.action.stop();
        }).catch(async (error) => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING deployment status: '));
            cli_ux_1.cli.action.stop();
            await this.select();
        });
    }
    async localMenu() {
        const list = {
            type: 'list',
            name: 'deployment',
            message: 'Select an action',
            choices: [
                'Create deployment',
                'List deployments',
                'Update deployment',
                'Archive deployment',
                'View deployment',
                'Deploy deployment',
                'Destroy deployment',
                'Status',
                'Delete deployment'
            ],
            default: 'List deployment',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(Deployment);
        if (flags.id) {
            await this.listTarget(flags.id, false);
        }
        if (flags.file) {
            await index_1.copyFile(flags.file).then((res) => {
                this.userObject = JSON.parse(res.toString());
            });
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'create' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('create'))) {
            if (flags.file) {
                await this.injectUserFile('create');
            }
            else {
                await this.createTarget();
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'list' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('list'))) {
            await this.listAllTargets(true);
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'view' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('view'))) {
            if (flags.id) {
                await this.listTarget(flags.id, true);
            }
            else {
                await this.select();
                await this.listTarget(this.selectedEntity['id'], true);
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'update' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('update'))) {
            if (flags.file) {
                await this.injectUserFile('update');
            }
            else {
                if (flags.id) {
                    await this.updateTarget(flags.id);
                }
                else {
                    await this.select();
                    await this.updateTarget(this.selectedEntity['id']);
                }
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'delete' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('delete'))) {
            if (flags.id) {
                await this.deleteTarget(flags.id);
            }
            else {
                await this.select();
                await this.deleteTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'deploy' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('deploy'))) {
            if (flags.id) {
                await this.listTarget(flags.id, false);
                await this.deployTarget(flags.id);
            }
            else {
                await this.select();
                await this.deployTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'status' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('status'))) {
            if (flags.id) {
                await this.listTarget(flags.id, false);
                await this.getDeploymentStatus(flags.id);
            }
            else {
                await this.select();
                await this.getDeploymentStatus(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status'] === 'destroy' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('destroy'))) {
            if (flags.id) {
                await this.listTarget(flags.id, false);
                await this.destroyDeployment(flags.id);
            }
            else {
                await this.select();
                await this.destroyDeployment(this.selectedEntity['id']);
            }
        }
    }
    filterFields(obj, filters) {
        let filtered = {};
        for (let i in obj) {
            if (!filters.find(f => f === i)) {
                filtered[i] = obj[i];
            }
        }
        return filtered;
    }
    async injectUserFile(action) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        // console.log('check that userObject is always defined here : ', this.userObject);
        switch (action) {
            case 'create':
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New deployment create from custom file: OK. Its id is: ${res['data']['id']}`));
                }).catch(error => {
                    this.error('Catched error on creating new deployment from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated deployment from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && this.userObject['id']) {
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    console.log('Catched error on updating deployment from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
    }
    async showSelectedEntityMenu(answer) {
        const { args, flags } = this.parse(Deployment);
        const filteredFields = ['id'];
        let selected = { 'deployment': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'deployment',
            message: 'Select the field you want to update',
            choices: choices,
            default: Object.keys(this.selectedEntity)[0],
        };
        if (answer.toLowerCase() === 'i' || answer.toLowerCase() === 'interactive') {
            // @ts-ignore
            selected = await inquirer.prompt(list);
        }
        else {
            selected[list.name] = 'manual';
        }
        if (selected[list.name] === 'manual') {
            await fs_1.promises.writeFile("json-templates/edited-entity.json", JSON.stringify(this.selectedEntity, null, 2));
            const editor = process.env.EDITOR || 'vi';
            const child = child_process_1.spawn(editor, ['json-templates/edited-entity.json'], {
                stdio: 'inherit'
            });
            await child.on('exit', async (e, code) => {
                await index_1.copyFile('json-templates/edited-entity.json').then((newCode) => {
                    this.userObject = JSON.parse(newCode.toString());
                    // console.log("finished", this.userObject);
                });
                const config = {
                    headers: { 'Authorization': "bearer " + index_1.user.data.token }
                };
                // console.log('before updating app : ', this.selectedEntity);
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments`, Object.assign({}, this.userObject), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated deployment from cli editor: OK`));
                }).catch(error => {
                    console.log('Catched error on updating deployment from cli editor: ');
                });
                return;
            });
        }
        else if (selected[list.name] === 'SEND UPDATE') {
            const config = {
                headers: { 'Authorization': "bearer " + index_1.user.data.token }
            };
            // console.log('before updating app : ', this.selectedEntity);
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments`, Object.assign({}, this.selectedEntity), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated deployment: OK`));
            }).catch(error => {
                console.log('Catched error on updating deployment: ');
            });
            return;
        }
        else {
            this.log(chalk_1.default.blue.bold(`Current value of ${selected[list.name]}: ${this.selectedEntity[selected[list.name]]}`));
            const newValue = await index_1.hamdleMissingOption(selected[list.name], 'single', this.selectedEntity[selected[list.name]], null);
            this.selectedEntity[selected[list.name]] = newValue;
            await this.showSelectedEntityMenu(answer);
        }
    }
    async deleteTarget(targetId) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`DELETE deployment: OK`));
        }).catch(async (error) => {
            console.log('Catched error on DELETING deployment:');
        });
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(Deployment);
        await this.listTarget(targetId, false);
        const filteredFields = ['id'];
        if (flags.name) {
            filteredFields.push('name');
            this.selectedEntity['name'] = flags.name;
        }
        if (flags.description) {
            filteredFields.push('description');
            this.selectedEntity['description'] = flags.description;
        }
        const question = {
            type: `single`,
            name: `mode`,
            message: `Choose a mode: manual or interactive  (m/i)? `,
            default: 'manual',
        };
        const answer = await inquirer.prompt([question]);
        await this.showSelectedEntityMenu(answer[question.name].toString());
    }
    async select() {
        await this.listAllTargets(false);
        const choices = [];
        const map = {};
        if (this.deployments.length > 0) {
            this.deployments.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'deployment',
                message: 'Select a deployment',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('deployment', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no deployment yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments/${targetId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW deployment: OK`));
                index_1.showSingleTable(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING deployment: '));
            await this.select();
        });
    }
    async listAllTargets(log) {
        const { args, flags } = this.parse(Deployment);
        // special treatment because deployment are coming from a workload
        let workload = { id: '' };
        if (!flags.workloadId) {
            await workload_1.default.prototype.select();
            workload = await node_persist_1.getItem('workload');
        }
        else {
            workload['id'] = flags.workloadId;
        }
        this.deployments = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments/workload/${workload['id']}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST deployment: OK`));
                const tableApps = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'status', header: null, nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'lastUpdate', header: 'last updated', nestedField: null, subField: null },
                    { name: 'workloadView', header: 'parent Workload', nestedField: null, subField: 'name' },
                    { name: 'infraView', header: 'Infraview', nestedField: null, subField: 'name' },
                    { name: 'targetAccountView', header: 'Target account', nestedField: null, subField: 'name' },
                ];
                index_1.showTable(res['data'], tableApps);
            }
            this.deployments = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all deployments: ', error);
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(Deployment);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        // first step is to choose a workload
        let workload = { id: '' };
        if (!flags.workloadId) {
            await workload_1.default.prototype.select();
            workload = await node_persist_1.getItem('workload');
        }
        else {
            workload['id'] = flags.workloadId;
        }
        let targetAccount = { id: '' };
        if (!flags.targetAccountId) {
            await target_account_1.default.prototype.select();
            targetAccount = await node_persist_1.getItem('targetAccount');
        }
        else {
            targetAccount['id'] = flags.targetAccountId;
        }
        let deploypack = { id: '' };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deploymentpacks/default`, config).then((res) => {
            // console.info(res['data'])
            deploypack = res['data'][0];
        }).catch(error => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING deploypack: '));
        });
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myDeployment', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const computationImplementationId = flags.computationImplementationId || await index_1.hamdleMissingOption('computationImplementationId', 'single', 'gcp-computeEngine', null);
        // const type = flags.type  || await hamdleMissingOption('type', 'single', 'NPM');
        const orgId = index_1.user.data.orgId;
        const body = {
            name: name,
            description: description,
            namespaceId: index_1.user.data.namespaceId,
            workloadId: workload['id'],
            targetAccountId: targetAccount['id'],
            owner: index_1.user.data.id,
            computationImplementationId: computationImplementationId,
            deploymentPackId: deploypack['id'] || null
        };
        // console.log('body of new deployment : ', body)
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/deployments`, body, config).then((res) => {
            console.log(chalk_1.default.green.bold(`New Deployment: OK`));
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new deployment: ');
        });
    }
}
exports.default = Deployment;
Deployment.description = 'Actions on deployment(s)';
Deployment.flags = {
    help: command_1.flags.help({ char: 'h' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing a deployment' }),
    id: command_1.flags.string({ char: 'i', description: 'provide a deployment id' }),
    workloadId: command_1.flags.string({ char: 'w', description: 'provide a workload id' }),
    targetAccountId: command_1.flags.string({ char: 't', description: 'provide a target account id' }),
    deploypackId: command_1.flags.string({ char: 'd', description: 'provide a deploypack id' }),
    computationImplementationId: command_1.flags.string({ char: 'c', description: 'provide an implementation. Ex: gcp-computeEngine' }),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to update/create a deployment' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to update/create a deployment' }),
};
Deployment.args = [
    { name: 'Create/List/Update/Archive/View/Delete/Deploy/Destroy/Status' },
];
