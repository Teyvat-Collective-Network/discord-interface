# Discord Interface

This API exists to allow all TCN services to interface with one Discord bot account without needing to start multiple instances. This has two main benefits, which are that it allows them to share a bot cache and thus save on resources that would otherwise be wasted having several processes running Discord bots, and secondly that it is more secure because the bot token will only need to be set in one location.

Unlike the other TCN repositories, feel free to fork/modify this for your own needs and run your own version of it. Just be careful to keep this API internal as there is no authentication - the purpose is for services on the same host to be able to use it without needing to store credentials, not to create an externally-facing interface.

(Of course, if you would like to create an externally-facing interface with authentication, by all means feel free to modify a fork of this repo to include that or create your own interface layer on top of this.)
