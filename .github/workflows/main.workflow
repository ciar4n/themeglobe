workflow "Push it!" {
  on = "push"
  resolves = ["push"]
}

action "push" {
  uses = "ludeeus/action-push@master"
  env = {
    ACTION_MAIL = "ciar4n@joomla51.com"
    ACTION_NAME = "bleep"
    ACTION_BRANCH = "master"
    ACTION_MESSAGE = "Resised Images, Obatained Lighthouse Data, wrote JSON file"
  }
  secrets = ["GITHUB_TOKEN"]
}
