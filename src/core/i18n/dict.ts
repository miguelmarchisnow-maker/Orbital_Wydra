export const DICT: Record<string, { pt: string; en: string }> = {
  // Menu
  'menu.novo_jogo': { pt: 'Novo Jogo', en: 'New Game' },
  'menu.mundos_salvos': { pt: 'Mundos Salvos', en: 'Saved Worlds' },
  'menu.configuracoes': { pt: 'Configurações', en: 'Settings' },
  'menu.titulo': { pt: 'Orbital Wydra', en: 'Orbital Wydra' },
  'menu.subtitulo': { pt: 'Expedição Estelar', en: 'Stellar Expedition' },
  'menu.footer': { pt: 'v0.1  ·  protótipo', en: 'v0.1  ·  prototype' },
  'menu.voltar': { pt: '◀ Voltar', en: '◀ Back' },
  'menu.nenhum_save': { pt: 'Nenhum mundo salvo ainda', en: 'No saved worlds yet' },
  'menu.titulo_saves': { pt: 'Mundos Salvos', en: 'Saved Worlds' },
  'menu.apagar_save': { pt: 'Apagar mundo "{nome}" permanentemente?', en: 'Delete world "{nome}" permanently?' },

  // HUD
  'hud.salvar': { pt: 'Salvar', en: 'Save' },
  'hud.configuracoes': { pt: 'Configurações', en: 'Settings' },
  'hud.menu': { pt: 'Menu', en: 'Menu' },
  'hud.salvo': { pt: 'Salvo', en: 'Saved' },
  'hud.erro_salvar': { pt: 'Erro ao salvar: {msg}', en: 'Save error: {msg}' },
  'hud.voltar_menu_confirm': { pt: 'Voltar ao menu? Seu progresso será salvo automaticamente.', en: 'Return to menu? Your progress will be saved automatically.' },

  // New world
  'novo_mundo.titulo': { pt: 'Novo Mundo', en: 'New World' },
  'novo_mundo.nome_label': { pt: 'Nome do mundo', en: 'World name' },
  'novo_mundo.placeholder': { pt: 'Ex: Valoria Prime', en: 'e.g. Valoria Prime' },
  'novo_mundo.criar': { pt: 'Criar', en: 'Create' },
  'novo_mundo.cancelar': { pt: 'Cancelar', en: 'Cancel' },
  'novo_mundo.erro_vazio': { pt: 'Nome é obrigatório', en: 'Name is required' },
  'novo_mundo.erro_longo': { pt: 'Máximo 40 caracteres', en: 'Maximum 40 characters' },
  'novo_mundo.erro_duplicado': { pt: 'Já existe um mundo com esse nome', en: 'A world with this name already exists' },

  // Pause
  'pause.continuar': { pt: 'Continuar', en: 'Continue' },
  'pause.salvar': { pt: 'Salvar', en: 'Save' },
  'pause.sair': { pt: 'Sair', en: 'Exit' },

  // Loading
  'loading.criando': { pt: 'Criando mundo', en: 'Creating world' },
  'loading.carregando': { pt: 'Carregando mundo: {nome}', en: 'Loading world: {nome}' },

  // Toast
  'toast.salvo': { pt: 'Salvo', en: 'Saved' },
  'toast.erro_save': { pt: 'Erro ao salvar: {msg}', en: 'Save error: {msg}' },

  // Naves
  'nave.colonizadora': { pt: 'Colonizadora', en: 'Colonizer' },
  'nave.cargueira': { pt: 'Cargueira', en: 'Freighter' },
  'nave.batedora': { pt: 'Batedora', en: 'Scout' },
  'nave.torreta': { pt: 'Torreta', en: 'Turret' },

  // Planetas
  'planeta.comum': { pt: 'Comum', en: 'Common' },
  'planeta.marte': { pt: 'Rochoso', en: 'Rocky' },
  'planeta.gasoso': { pt: 'Gasoso', en: 'Gas Giant' },

  // Settings
  'settings.titulo': { pt: 'Configurações', en: 'Settings' },
  'settings.aba_audio': { pt: 'Áudio', en: 'Audio' },
  'settings.aba_graficos': { pt: 'Gráficos', en: 'Graphics' },
  'settings.aba_jogabilidade': { pt: 'Jogabilidade', en: 'Gameplay' },
  'settings.resetar_aba': { pt: 'Resetar esta aba', en: 'Reset this tab' },
  'settings.resetar_tudo': { pt: 'Resetar tudo', en: 'Reset all' },

  // Idioma
  'idioma.label': { pt: 'Idioma', en: 'Language' },
  'idioma.pt': { pt: 'Português', en: 'Portuguese' },
  'idioma.en': { pt: 'English', en: 'English' },

  // Input categorias
  'input.cat_camera': { pt: 'Câmera', en: 'Camera' },
  'input.cat_interface': { pt: 'Interface', en: 'Interface' },
  'input.cat_jogo': { pt: 'Jogo', en: 'Game' },
  'input.cat_debug': { pt: 'Debug', en: 'Debug' },

  // Input
  'input.titulo_secao': { pt: 'Controles', en: 'Controls' },
  'input.rebind': { pt: 'Rebind', en: 'Rebind' },
  'input.pressione': { pt: 'Pressione tecla...', en: 'Press key...' },
  'input.conflito_titulo': { pt: 'Conflito de tecla', en: 'Key conflict' },
  'input.conflito': { pt: 'Já usado por "{acao}". Trocar?', en: 'Already used by "{acao}". Swap?' },
  'input.trocar': { pt: 'Trocar', en: 'Swap' },
  'input.resetar': { pt: 'Resetar controles', en: 'Reset controls' },
};
