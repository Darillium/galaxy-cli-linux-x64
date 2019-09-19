"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const axios_1 = require("axios");
const index_1 = require("../index");
const login_1 = require("./login");
const chalk_1 = require("chalk");
const logout_1 = require("./logout");
const cli_ux_1 = require("cli-ux");
class ChangePassword extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(ChangePassword);
        if (await login_1.alreadyLoggedIn()) {
            if (!flags.oldPassword) {
                const OPassword = await index_1.hamdleMissingOption('oldPassword', 'single', '', null);
                flags.oldPassword = OPassword;
            }
            if (!flags.newPassword) {
                const NPassword = await index_1.hamdleMissingOption('newPassword', 'single', '', null);
                flags.newPassword = NPassword;
            }
            if (flags.newPassword !== flags.oldPassword) {
                await this.updatePassword(flags.oldPassword, flags.newPassword);
            }
            else {
                this.log(chalk_1.default.red.bold('Please provide 2 different value for old and new passwords'));
                await this.run();
            }
        }
        else {
            this.log(chalk_1.default.red.bold('you are not logged in...'));
        }
    }
    async updatePassword(oldP, newP) {
        const { args, flags } = this.parse(ChangePassword);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token },
            observe: 'response',
            accept: 'application/json;charset=UTF-8',
        };
        const body = { oldPassword: oldP, password: newP };
        cli_ux_1.cli.action.start('Change password in process...');
        axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/users/${index_1.user.data.id}/password/self`, body, config).then(async (res) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.green.bold(`Sucessfully changed password !! login out... `));
            await logout_1.default.prototype.resetData();
        }).catch((err) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.red.bold(`Could not change password. `, err));
        });
    }
}
exports.default = ChangePassword;
ChangePassword.description = 'change your password';
ChangePassword.flags = {
    help: command_1.flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    oldPassword: command_1.flags.string({ char: 'p', description: 'old password' }),
    newPassword: command_1.flags.string({ char: 'n', description: 'new password' }),
};
ChangePassword.args = [];
