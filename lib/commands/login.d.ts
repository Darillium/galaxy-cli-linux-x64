import { Command, flags } from '@oclif/command';
export declare var isLoggedIn: boolean;
export declare let globalFlags: {
    file: string | undefined;
    target: string | undefined;
};
export default class Login extends Command {
    static args: never[];
    static flags: {
        target: flags.IOptionFlag<string | undefined>;
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        email: flags.IOptionFlag<string | undefined>;
        password: flags.IOptionFlag<string | undefined>;
        ns: flags.IOptionFlag<string | undefined>;
    };
    static description: string;
    run(): Promise<void>;
    login(email: string | undefined, password: string | undefined, endpoint: string | undefined): Promise<void>;
}
export declare function alreadyLoggedIn(): Promise<boolean>;
