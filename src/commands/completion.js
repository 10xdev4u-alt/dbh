const BASH_COMPLETION = `
_dbh_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  opts="up down logs restart status health url models metrics usage plugins chat tunnel webhook use init account key config backup update doctor repl help"

  if [[ \${cur} == -* ]] ; then
    COMPREPLY=( $(compgen -W "--help --version --json --quiet" -- \${cur}) )
    return 0
  fi

  case "\${prev}" in
    account|key|tunnel|webhook|use|config)
      local sub="list add remove rm test switch select ls"
      COMPREPLY=( $(compgen -W "\${sub}" -- \${cur}) )
      return 0
      ;;
    logs)
      COMPREPLY=( $(compgen -W "-f --follow -n --lines" -- \${cur}) )
      return 0
      ;;
    chat)
      COMPREPLY=( $(compgen -W "-m --model" -- \${cur}) )
      return 0
      ;;
    *)
      COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
      return 0
      ;;
  esac
}

complete -F _dbh_completions dbh
`;

const ZSH_COMPLETION = `
#compdef dbh

_dbh_commands() {
  local -a commands
  commands=(
    'up:Start the proxy'
    'down:Stop the proxy'
    'logs:View proxy logs'
    'restart:Restart the proxy'
    'status:Show proxy status'
    'health:Quick health check'
    'url:Get tunnel URL'
    'models:List available models'
    'metrics:Show Prometheus metrics'
    'usage:Show usage statistics'
    'plugins:List loaded plugins'
    'chat:Send a prompt to the proxy'
    'tunnel:Manage tunnel'
    'webhook:Manage webhooks'
    'use:Manage proxy instances'
    'init:Interactive setup wizard'
    'account:Manage DeepSeek accounts'
    'key:Manage API keys'
    'config:Manage configuration'
    'backup:Backup data and config'
    'update:Pull latest image and restart'
    'doctor:Run diagnostics'
    'repl:Interactive REPL mode'
  )
  _describe 'command' commands
}

_dbh() {
  local context state state_descr line
  typeset -A opt_args

  _arguments \\
    '--help[Show help]' \\
    '--version[Show version]' \\
    '--json[JSON output mode]' \\
    '-q[Quiet mode]' \\
    '--quiet[Quiet mode]' \\
    '1: :->command' \\
    '*:: :->args'

  case \$state in
    command)
      _dbh_commands
      ;;
    args)
      case \$words[1] in
        account|key|tunnel|webhook|config)
          local -a sub
          sub=('list:List' 'add:Add' 'remove:Remove' 'rm:Remove' 'test:Test' 'ls:List' 'switch:Switch' 'select:Select')
          _describe 'subcommand' sub
          ;;
        logs)
          _arguments '-f[Follow]' '--follow[Follow]' '-n[Lines]' '--lines[Lines]'
          ;;
        chat)
          _arguments '-m[Model]' '--model[Model]'
          ;;
        completion)
          local -a shells
          shells=('bash:Bash' 'zsh:Zsh')
          _describe 'shell' shells
          ;;
      esac
      ;;
  esac
}

_dbh "$@"
`;

export async function handler(shell = 'bash') {
  if (shell === 'bash') {
    return BASH_COMPLETION.trim();
  } else if (shell === 'zsh') {
    return ZSH_COMPLETION.trim();
  } else {
    throw new Error(`Unknown shell: ${shell}. Use bash or zsh.`);
  }
}
