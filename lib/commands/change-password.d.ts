import { Command, flags } from '@oclif/command';
export default class ChangePassword extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        oldPassword: flags.IOptionFlag<string | undefined>;
        newPassword: flags.IOptionFlag<string | undefined>;
    };
    static args: never[];
    run(): Promise<void>;
    updatePassword(oldP: string | undefined, newP: string | undefined): Promise<void>;
}
