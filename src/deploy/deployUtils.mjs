export const getTomcatSettings = (envConfig, cli) => {
    let user = cli.flags.user || envConfig.TOMCAT_USER;
    let password = cli.flags.password || envConfig.TOMCAT_PASSWORD;
    let managerUrl = cli.flags.tomcatUrl || envConfig.TOMCAT_MANAGER_URL;
    if (cli.flags.env) {
        const env = cli.flags.env.toUpperCase();
        const envUser = envConfig[`TOMCAT_USER_${env}`];
        if (envUser) {
            user = envUser;
        }
        const envPassword = envConfig[`TOMCAT_PASSWORD_${env}`];
        if (envPassword) {
            password = envPassword;
        }
        const envManagerUrl = envConfig[`TOMCAT_MANAGER_URL_${env}`];
        if (envManagerUrl) {
            managerUrl = envManagerUrl;
        }
    }
    if (!user || !password) {
        console.error('First specify Tomcat user and password. See --help for more info.');
        process.exit(1);
    }
    if (!managerUrl) {
        console.error(`Tomcat manager url not set for env "${cli.flags.env}"`);
        process.exit(1);
    }

    return { url: managerUrl, user, password };
};
