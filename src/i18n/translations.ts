export type Language = "ru" | "en" | "tj";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tj", label: "Тоҷикӣ", flag: "🇹🇯" },
];

export type Dict = {
  nav: {
    group: string;
    overview: string;
    companies: string;
    tariffs: string;
    packages: string;
    users: string;
    cities: string;
    permissions: string;
    roles: string;
    activityLogs: string;
  };
  titles: {
    companyDetail: string;
    packageDetail: string;
    roleDetail: string;
    dashboard: string;
  };
  sidebar: {
    lightTheme: string;
    darkTheme: string;
    logout: string;
    logoutConfirmTitle: string;
    logoutConfirmDescription: string;
    profile: string;
  };
  bottomNav: {
    more: string;
    allSections: string;
  };
  common: {
    cancel: string;
    save: string;
    create: string;
    edit: string;
    delete: string;
    close: string;
    back: string;
    next: string;
    actions: string;
    loading: string;
    noPhoto: string;
    chooseImage: string;
    generate: string;
    copyPassword: string;
    passwordCopied: string;
    deleteQuestion: string;
    confirmDelete: string;
    name: string;
    city: string;
    status: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    created: string;
    image: string;
    price: string;
    statusActive: string;
    statusTrial: string;
    statusSuspended: string;
    active: string;
    disabled: string;
    nothingFound: string;
    package: string;
    rowNumber: string;
    pageSize: string;
  };
  permissionsPicker: {
    filterPlaceholder: string;
    selectAll: string;
    otherModule: string;
    noPermissions: string;
    noResults: string;
  };
  permissionsPage: {
    title: string;
    searchPlaceholder: string;
    editGroup: string;
    editPermission: string;
    editGroupTitle: string;
    editPermissionTitle: string;
    code: string;
    toasts: {
      groupUpdated: string;
      permissionUpdated: string;
    };
    errors: {
      loadPermissions: string;
      loadDetail: string;
      saveGroup: string;
      savePermission: string;
    };
  };
  login: {
    lead: string;
    email: string;
    password: string;
    forgotPassword: string;
    showPassword: string;
    hidePassword: string;
    submit: string;
    fillFields: string;
    loginFailed: string;
    forgotTitle: string;
    forgotEmailRequired: string;
    forgotSuccess: string;
    forgotFailed: string;
    send: string;
    cancel: string;
  };
  overview: {
    title: string;
    activeSuffix: string;
    incomeMonth: string;
    lastMonthPrefix: string;
    users: string;
    allTenants: string;
    catalog: string;
    recentCompanies: string;
    viewAll: string;
    noCompanies: string;
    createTenant: string;
  };
  companies: {
    title: string;
    sub: string;
    searchPlaceholder: string;
    newCompany: string;
    noCompaniesYet: string;
    createCompany: string;
    tableCompany: string;
    tableUsers: string;
    isolationNote: string;
    dialogTitle: string;
    created: string;
    cityNotSelected: string;
    addressLang: (lang: string) => string;
    descriptionLang: (lang: string) => string;
    errors: { loadCompanies: string; saveCompany: string; savePhoto: string };
  };
  companyDetail: {
    notFoundTitle: string;
    notFoundText: string;
    backToList: string;
    sub: string;
    ownersTitle: string;
    addOwner: string;
    noOwners: string;
    loginLabel: string;
    fullName: string;
    ownerModalTitleEdit: string;
    ownerModalTitleCreate: string;
    deleteCompanyTitle: string;
    deleteCompanyDesc: (name: string) => string;
    ownerWillBeDeleted: string;
    ownersCount: string;
    subscriptionTitle: string;
    noSubscription: string;
    noTariff: string;
    subscriptionStart: string;
    subscriptionEnd: string;
    fromTariff: string;
    originalCost: string;
    toasts: {
      ownerSaved: string;
      ownerAdded: string;
      ownerDeleted: string;
      companySaved: string;
      companyDeleted: string;
      subscriptionSaved: string;
    };
    errors: { loadCompany: string; saveCompany: string; deleteCompany: string; saveSubscription: string };
  };
  users: {
    title: string;
    searchPlaceholder: string;
    newUser: string;
    noUsersYet: string;
    createUser: string;
    tableUser: string;
    tableEmail: string;
    tableStatus: string;
    modalTitleCreate: string;
    firstName: string;
    lastName: string;
    middleName: string;
    nickName: string;
    avatarUrl: string;
    userActive: string;
    errors: { loadUsers: string; saveUser: string };
    toasts: { created: string };
  };
  userDetail: {
    notFoundTitle: string;
    notFoundText: string;
    backToList: string;
    sub: string;
    assignedRoles: string;
    noRolesAssigned: string;
    manageRoles: string;
    manageRolesTitle: string;
    noRolesAvailable: string;
    deleteUserTitle: string;
    deleteUserDesc: (name: string) => string;
    errors: { saveUser: string; deleteUser: string; loadRoles: string };
    toasts: { saved: string; deleted: string; rolesUpdated: string };
  };
  profile: {
    sub: string;
    changeAvatar: string;
    errors: { saveProfile: string };
    toasts: { saved: string };
  };
  packages: {
    title: string;
    addPackage: string;
    addPackageAction: string;
    noPackagesYet: string;
    tablePrice: string;
    tablePermissionGroups: string;
    modalTitleEdit: string;
    modalTitleCreate: string;
    nameLang: (lang: string) => string;
    descLang: (lang: string) => string;
    permissions: string;
    packageActive: string;
    deleteDesc: string;
    errors: {
      loadPackages: string;
      loadPermissions: string;
      loadPackagePermissions: string;
      savePackage: string;
      deletePackage: string;
    };
    toasts: { saved: string; created: string; deleted: string };
  };
  packageDetail: {
    notFoundTitle: string;
    notFoundText: string;
    backToList: string;
    sub: string;
    assignedPermissions: string;
    noPermissionsAssigned: string;
    managePermissions: string;
    managePermissionsTitle: string;
    deletePackageTitle: string;
    deletePackageDesc: (name: string) => string;
    toasts: {
      saved: string;
      deleted: string;
      permissionsUpdated: string;
    };
  };
  roles: {
    title: string;
    searchPlaceholder: string;
    addRole: string;
    addRoleAction: string;
    noRolesYet: string;
    tableRole: string;
    tableCode: string;
    modalTitleCreate: string;
    code: string;
    nameLang: (lang: string) => string;
    errors: { loadRoles: string; saveRole: string };
    toasts: { created: string };
  };
  roleDetail: {
    notFoundTitle: string;
    notFoundText: string;
    backToList: string;
    sub: string;
    code: string;
    assignedPermissions: string;
    noPermissionsAssigned: string;
    managePermissions: string;
    managePermissionsTitle: string;
    assignedUsers: string;
    noUsersAssigned: string;
    removeUserTitle: string;
    removeUserDesc: (name: string) => string;
    duplicateRole: string;
    duplicateRoleTitle: string;
    duplicateRoleDesc: string;
    deleteRoleTitle: string;
    deleteRoleDesc: (name: string) => string;
    errors: {
      saveRole: string;
      deleteRole: string;
      loadPermissions: string;
      savePermissions: string;
      duplicateRole: string;
      removeUser: string;
    };
    toasts: {
      saved: string;
      deleted: string;
      permissionsUpdated: string;
      duplicated: string;
      userRemoved: string;
    };
  };
  tariffs: {
    title: string;
    addTariff: string;
    addTariffAction: string;
    noTariffsYet: string;
    tableTariff: string;
    tablePackages: string;
    perMonth: string;
    modalTitleEdit: string;
    modalTitleCreate: string;
    code: string;
    packagesLabel: string;
    choosePackage: string;
    descLang: (lang: string) => string;
    tariffActive: string;
    deleteTariffTitle: string;
    deleteTariffDesc: (code: string) => string;
    errors: { loadTariffs: string; loadPackages: string; saveTariff: string; deleteTariff: string };
    toasts: { saved: string; created: string; deleted: string };
  };
  cities: {
    title: string;
    addCity: string;
    noCitiesYet: string;
    addCityAction: string;
    deleteDesc: string;
    modalTitleEdit: string;
    modalTitleCreate: string;
    nameLang: (lang: string) => string;
    order: string;
    errors: { loadCities: string; saveCity: string; deleteCity: string };
    toasts: { citySaved: string; cityCreated: string; cityDeleted: string };
  };
  activityLogs: {
    title: string;
    filters: {
      entityId: string;
      entityIdPlaceholder: string;
      activityCode: string;
      activityCodePlaceholder: string;
      creator: string;
      creatorPlaceholder: string;
      creatorSearching: string;
      creatorNotFound: string;
      email: string;
      emailPlaceholder: string;
      ipAddress: string;
      ipAddressPlaceholder: string;
      serviceName: string;
      serviceNamePlaceholder: string;
      sessionId: string;
      sessionIdPlaceholder: string;
      requestId: string;
      requestIdPlaceholder: string;
      type: string;
      typeNotSelected: string;
      period: string;
      periodFrom: string;
      periodTo: string;
      toggle: string;
    };
    types: {
      created: string;
      updated: string;
      deleted: string;
      viewed: string;
    };
    tableCreator: string;
    tableActivity: string;
    tableType: string;
    tableService: string;
    tableCreatedAt: string;
    noLogsYet: string;
    detail: {
      activityType: string;
      code: string;
      action: string;
      creator: string;
      email: string;
      ipAddress: string;
      date: string;
      createdAtTime: (time: string) => string;
      entityType: string;
      systemName: string;
      id: string;
      entityId: string;
      sessionId: string;
      requestId: string;
      data: string;
      notAvailable: string;
      copied: string;
      notFound: string;
    };
    errors: { loadLogs: string; loadDetail: string };
  };
  resetPassword: {
    lead: string;
    invalidLink: string;
    newPassword: string;
    repeatPassword: string;
    submit: string;
    errors: { missingToken: string; mismatch: string; empty: string; failed: string };
    success: string;
  };
};

export const translations: Record<Language, Dict> = {
  ru: {
    nav: {
      group: "Платформа",
      overview: "Обзор",
      companies: "Компании",
      tariffs: "Тарифы",
      packages: "Пакеты",
      users: "Пользователи",
      cities: "Города",
      permissions: "Права доступа",
      roles: "Роли",
      activityLogs: "Журнал активности",
    },
    titles: {
      companyDetail: "Компания",
      packageDetail: "Пакет",
      roleDetail: "Роль",
      dashboard: "Панель управления",
    },
    sidebar: {
      lightTheme: "Светлая тема",
      darkTheme: "Тёмная тема",
      logout: "Выйти",
      logoutConfirmTitle: "Выйти из аккаунта?",
      logoutConfirmDescription: "Вам нужно будет снова войти, чтобы продолжить работу.",
      profile: "Профиль",
    },
    bottomNav: {
      more: "Ещё",
      allSections: "Все разделы",
    },
    common: {
      cancel: "Отмена",
      save: "Сохранить",
      create: "Создать",
      edit: "Изменить",
      delete: "Удалить",
      close: "Закрыть",
      back: "Назад",
      next: "Вперёд",
      actions: "Действия",
      loading: "Загрузка...",
      noPhoto: "Нет фото",
      chooseImage: "Выбрать изображение",
      generate: "Сгенерировать",
      copyPassword: "Копировать пароль",
      passwordCopied: "Пароль скопирован",
      deleteQuestion: "Удалить?",
      confirmDelete: "Да, удалить",
      name: "Название",
      city: "Город",
      status: "Статус",
      description: "Описание",
      email: "Email",
      phone: "Телефон",
      address: "Адрес",
      created: "Создана",
      image: "Изображение",
      price: "Цена, $/мес",
      statusActive: "Активна",
      statusTrial: "Триал",
      statusSuspended: "Приостановлена",
      active: "Активен",
      disabled: "Отключен",
      nothingFound: "Ничего не найдено.",
      package: "Пакет",
      rowNumber: "№",
      pageSize: "Показывать:",
    },
    permissionsPicker: {
      filterPlaceholder: "Фильтровать по категории",
      selectAll: "Выбрать все",
      otherModule: "Прочее",
      noPermissions: "Нет доступных прав.",
      noResults: "Ничего не найдено.",
    },
    permissionsPage: {
      title: "Права доступа",
      searchPlaceholder: "Поиск по группам и правам",
      editGroup: "Изменить группу",
      editPermission: "Изменить право",
      editGroupTitle: "Редактировать группу прав",
      editPermissionTitle: "Редактировать право",
      code: "Код",
      toasts: {
        groupUpdated: "Группа обновлена",
        permissionUpdated: "Право обновлено",
      },
      errors: {
        loadPermissions: "Не удалось загрузить права доступа",
        loadDetail: "Не удалось загрузить данные",
        saveGroup: "Не удалось сохранить группу",
        savePermission: "Не удалось сохранить право",
      },
    },
    login: {
      lead: "Войдите, чтобы управлять компаниями, тарифами и пользователями.",
      email: "Email",
      password: "Пароль",
      forgotPassword: "Забыли пароль?",
      showPassword: "Показать пароль",
      hidePassword: "Скрыть пароль",
      submit: "Войти",
      fillFields: "Заполните email и пароль",
      loginFailed: "Не удалось войти",
      forgotTitle: "Восстановление пароля",
      forgotEmailRequired: "Введите email",
      forgotSuccess: "Если email существует, на него отправлена ссылка для сброса пароля",
      forgotFailed: "Не удалось отправить запрос",
      send: "Отправить",
      cancel: "Отмена",
    },
    overview: {
      title: "Обзор платформы",
      activeSuffix: "активных",
      incomeMonth: "Доход / мес",
      lastMonthPrefix: "прошлый:",
      users: "Пользователи",
      allTenants: "во всех тенантах",
      catalog: "каталог",
      recentCompanies: "Последние компании",
      viewAll: "Все",
      noCompanies: "Компаний пока нет.",
      createTenant: "Создать тенанта",
    },
    companies: {
      title: "Компании",
      sub: "создание и управление тенантами",
      searchPlaceholder: "Поиск по названию или городу",
      newCompany: "+ Новая компания",
      noCompaniesYet: "Компаний пока нет.",
      createCompany: "Создать компанию",
      tableCompany: "Компания",
      tableUsers: "Пользователи",
      isolationNote: "Данные компаний изолированы. Каждая компания работает только внутри своего пакета.",
      dialogTitle: "Новая компания",
      created: "Компания создана",
      cityNotSelected: "Город не выбран",
      addressLang: (lang) => `Адрес (${lang})`,
      descriptionLang: (lang) => `Описание (${lang})`,
      errors: {
        loadCompanies: "Не удалось загрузить список компаний",
        saveCompany: "Не удалось сохранить компанию",
        savePhoto: "Компания создана, но не удалось загрузить фото",
      },
    },
    companyDetail: {
      notFoundTitle: "Компания не найдена",
      notFoundText: "Такой компании больше нет в списке.",
      backToList: "К списку компаний",
      sub: "карточка компании",
      ownersTitle: "Владельцы",
      addOwner: "+ Добавить владельца",
      noOwners: "Пока нет владельцев.",
      loginLabel: "Логин:",
      fullName: "ФИО",
      ownerModalTitleEdit: "Редактировать владельца",
      ownerModalTitleCreate: "Новый владелец",
      deleteCompanyTitle: "Удалить компанию?",
      deleteCompanyDesc: (name) => `Удалить компанию «${name}»? Это действие необратимо.`,
      ownerWillBeDeleted: "Владелец будет удалён.",
      ownersCount: "Владельцев",
      subscriptionTitle: "Подписка",
      noSubscription: "Подписка не оформлена.",
      noTariff: "Тариф не выбран",
      subscriptionStart: "Дата начала",
      subscriptionEnd: "Дата окончания",
      fromTariff: "Входит в тариф",
      originalCost: "Исходная стоимость",
      toasts: {
        ownerSaved: "Владелец сохранён",
        ownerAdded: "Владелец добавлен",
        ownerDeleted: "Владелец удалён",
        companySaved: "Компания сохранена",
        companyDeleted: "Компания удалена",
        subscriptionSaved: "Подписка сохранена",
      },
      errors: {
        loadCompany: "Не удалось загрузить компанию",
        saveCompany: "Не удалось сохранить компанию",
        deleteCompany: "Не удалось удалить компанию",
        saveSubscription: "Не удалось сохранить подписку",
      },
    },
    users: {
      title: "Пользователи платформы",
      searchPlaceholder: "Поиск по имени или email",
      newUser: "+ Новый пользователь",
      noUsersYet: "Пользователей пока нет.",
      createUser: "Создать пользователя",
      tableUser: "Пользователь",
      tableEmail: "Email",
      tableStatus: "Статус",
      modalTitleCreate: "Новый пользователь",
      firstName: "Имя",
      lastName: "Фамилия",
      middleName: "Отчество",
      nickName: "Никнейм",
      avatarUrl: "Ссылка на аватар",
      userActive: "Пользователь активен",
      errors: { loadUsers: "Не удалось загрузить пользователей", saveUser: "Не удалось сохранить пользователя" },
      toasts: { created: "Пользователь создан" },
    },
    userDetail: {
      notFoundTitle: "Пользователь не найден",
      notFoundText: "Такого пользователя не существует или он был удалён.",
      backToList: "К списку пользователей",
      sub: "карточка пользователя",
      assignedRoles: "Роли",
      noRolesAssigned: "Роли не назначены.",
      manageRoles: "Управлять ролями",
      manageRolesTitle: "Роли пользователя",
      noRolesAvailable: "Роли ещё не созданы.",
      deleteUserTitle: "Удалить пользователя?",
      deleteUserDesc: (name: string) => `Удалить пользователя «${name}»? Это действие необратимо.`,
      errors: {
        saveUser: "Не удалось сохранить пользователя",
        deleteUser: "Не удалось удалить пользователя",
        loadRoles: "Не удалось загрузить роли",
      },
      toasts: {
        saved: "Пользователь сохранён",
        deleted: "Пользователь удалён",
        rolesUpdated: "Роли обновлены",
      },
    },
    profile: {
      sub: "мой профиль",
      changeAvatar: "Изменить фото",
      errors: { saveProfile: "Не удалось сохранить профиль" },
      toasts: { saved: "Профиль сохранён" },
    },
    packages: {
      title: "Пакеты",
      addPackage: "+ Добавить пакет",
      addPackageAction: "Добавить пакет",
      noPackagesYet: "Пакетов пока нет.",
      tablePrice: "Цена",
      tablePermissionGroups: "Группы прав",
      modalTitleEdit: "Редактировать пакет",
      modalTitleCreate: "Новый пакет",
      nameLang: (lang) => `Название (${lang})`,
      descLang: (lang) => `Описание (${lang})`,
      permissions: "Права доступа",
      packageActive: "Пакет активен",
      deleteDesc: "Пакет будет удалён без возможности восстановления.",
      errors: {
        loadPackages: "Не удалось загрузить пакеты",
        loadPermissions: "Не удалось загрузить права доступа",
        loadPackagePermissions: "Не удалось загрузить права пакета",
        savePackage: "Не удалось сохранить пакет",
        deletePackage: "Не удалось удалить пакет",
      },
      toasts: { saved: "Пакет сохранён", created: "Пакет создан", deleted: "Пакет удалён" },
    },
    packageDetail: {
      notFoundTitle: "Пакет не найден",
      notFoundText: "Такого пакета больше нет в списке.",
      backToList: "К списку пакетов",
      sub: "информация о пакете",
      assignedPermissions: "Назначенные права",
      noPermissionsAssigned: "Права пока не назначены.",
      managePermissions: "Управление правами",
      managePermissionsTitle: "Управление правами",
      deletePackageTitle: "Удалить пакет?",
      deletePackageDesc: (name) => `Удалить пакет «${name}»? Это действие необратимо.`,
      toasts: {
        saved: "Пакет сохранён",
        deleted: "Пакет удалён",
        permissionsUpdated: "Права обновлены",
      },
    },
    roles: {
      title: "Роли",
      searchPlaceholder: "Поиск по роли или коду",
      addRole: "+ Добавить роль",
      addRoleAction: "Добавить роль",
      noRolesYet: "Роли пока не созданы.",
      tableRole: "Роль",
      tableCode: "Код",
      modalTitleCreate: "Новая роль",
      code: "Код роли",
      nameLang: (lang) => `Название (${lang})`,
      errors: { loadRoles: "Не удалось загрузить роли", saveRole: "Не удалось сохранить роль" },
      toasts: { created: "Роль создана" },
    },
    roleDetail: {
      notFoundTitle: "Роль не найдена",
      notFoundText: "Такой роли больше нет в списке.",
      backToList: "К списку ролей",
      sub: "информация о роли",
      code: "Код роли",
      assignedPermissions: "Назначенные права",
      noPermissionsAssigned: "Права пока не назначены.",
      managePermissions: "Управление правами",
      managePermissionsTitle: "Управление правами роли",
      assignedUsers: "Пользователи с этой ролью",
      noUsersAssigned: "Роль пока никому не назначена.",
      removeUserTitle: "Снять роль с пользователя?",
      removeUserDesc: (name) => `Снять роль с «${name}»?`,
      duplicateRole: "Дублировать",
      duplicateRoleTitle: "Дублировать роль",
      duplicateRoleDesc: "Создать копию роли с новым кодом и названием. Права будут скопированы.",
      deleteRoleTitle: "Удалить роль?",
      deleteRoleDesc: (name) => `Удалить роль «${name}»? Это действие необратимо.`,
      errors: {
        saveRole: "Не удалось сохранить роль",
        deleteRole: "Не удалось удалить роль",
        loadPermissions: "Не удалось загрузить права доступа",
        savePermissions: "Не удалось сохранить права",
        duplicateRole: "Не удалось дублировать роль",
        removeUser: "Не удалось снять роль с пользователя",
      },
      toasts: {
        saved: "Роль сохранена",
        deleted: "Роль удалена",
        permissionsUpdated: "Права обновлены",
        duplicated: "Роль продублирована",
        userRemoved: "Роль снята с пользователя",
      },
    },
    tariffs: {
      title: "Тарифы",
      addTariff: "+ Добавить тариф",
      addTariffAction: "Добавить тариф",
      noTariffsYet: "Тарифные планы пока не настроены.",
      tableTariff: "Тариф",
      tablePackages: "Пакеты",
      perMonth: "/ мес",
      modalTitleEdit: "Редактировать тариф",
      modalTitleCreate: "Новый тариф",
      code: "Код тарифа",
      packagesLabel: "Пакеты",
      choosePackage: "Выберите пакет…",
      descLang: (lang) => `Описание (${lang})`,
      tariffActive: "Тариф активен",
      deleteTariffTitle: "Удалить тариф?",
      deleteTariffDesc: (code) => `Удалить тариф «${code}»? Это действие необратимо.`,
      errors: {
        loadTariffs: "Не удалось загрузить тарифы",
        loadPackages: "Не удалось загрузить пакеты",
        saveTariff: "Не удалось сохранить тариф",
        deleteTariff: "Не удалось удалить тариф",
      },
      toasts: { saved: "Тариф сохранён", created: "Тариф создан", deleted: "Тариф удалён" },
    },
    cities: {
      title: "Города",
      addCity: "+ Добавить город",
      noCitiesYet: "Городов пока нет.",
      addCityAction: "Добавить город",
      deleteDesc: "Город будет удалён без возможности восстановления.",
      modalTitleEdit: "Редактировать город",
      modalTitleCreate: "Новый город",
      nameLang: (lang) => `Название (${lang})`,
      order: "Порядок",
      errors: {
        loadCities: "Не удалось загрузить города",
        saveCity: "Не удалось сохранить город",
        deleteCity: "Не удалось удалить город",
      },
      toasts: {
        citySaved: "Город сохранён",
        cityCreated: "Город создан",
        cityDeleted: "Город удалён",
      },
    },
    activityLogs: {
      title: "Журнал активности",
      filters: {
        entityId: "ID сущности",
        entityIdPlaceholder: "Введите ID сущности",
        activityCode: "Тип активности",
        activityCodePlaceholder: "Введите тип активности",
        creator: "Создатель",
        creatorPlaceholder: "Введите имя пользователя или ID",
        creatorSearching: "Поиск...",
        creatorNotFound: "Пользователь не найден",
        email: "Эл. почта",
        emailPlaceholder: "Введите адрес электронной почты",
        ipAddress: "IP-адрес",
        ipAddressPlaceholder: "Введите IP-адрес",
        serviceName: "Название системы",
        serviceNamePlaceholder: "Введите название системы",
        sessionId: "Идентификатор сессии",
        sessionIdPlaceholder: "Введите идентификатор сессии",
        requestId: "Идентификатор запроса",
        requestIdPlaceholder: "Введите идентификатор запроса",
        type: "Тип",
        typeNotSelected: "Не выбрано",
        period: "Время действия",
        periodFrom: "Начало периода",
        periodTo: "Конец периода",
        toggle: "Все фильтры",
      },
      types: {
        created: "Создано",
        updated: "Обновлено",
        deleted: "Удалено",
        viewed: "Просмотрено",
      },
      tableCreator: "Имя создателя",
      tableActivity: "Название типа активности",
      tableType: "Тип",
      tableService: "Название системы",
      tableCreatedAt: "Дата создания",
      noLogsYet: "Записи не найдены.",
      detail: {
        activityType: "Тип активности",
        code: "Код",
        action: "Действие",
        creator: "Создатель",
        email: "Эл. почта",
        ipAddress: "IP-адрес",
        date: "Дата",
        createdAtTime: (time) => `Дата создания в ${time}`,
        entityType: "Тип сущности",
        systemName: "Название сервиса",
        id: "ID",
        entityId: "ID сущности",
        sessionId: "Идентификатор сессии",
        requestId: "Идентификатор запроса",
        data: "Данные",
        notAvailable: "—",
        copied: "Скопировано",
        notFound: "Запись не найдена.",
      },
      errors: { loadLogs: "Не удалось загрузить журнал активности", loadDetail: "Не удалось загрузить запись" },
    },
    resetPassword: {
      lead: "Придумайте новый пароль для входа.",
      invalidLink: "Ссылка недействительна или устарела. Запросите восстановление пароля заново.",
      newPassword: "Новый пароль",
      repeatPassword: "Повторите пароль",
      submit: "Сохранить пароль",
      errors: {
        missingToken: "Ссылка недействительна: отсутствует токен",
        mismatch: "Пароли не совпадают",
        empty: "Введите новый пароль",
        failed: "Не удалось изменить пароль",
      },
      success: "Пароль изменён, войдите с новым паролем",
    },
  },
  en: {
    nav: {
      group: "Platform",
      overview: "Overview",
      companies: "Companies",
      tariffs: "Tariffs",
      packages: "Packages",
      users: "Users",
      cities: "Cities",
      permissions: "Permissions",
      roles: "Roles",
      activityLogs: "Activity Log",
    },
    titles: {
      companyDetail: "Company",
      packageDetail: "Package",
      roleDetail: "Role",
      dashboard: "Dashboard",
    },
    sidebar: {
      lightTheme: "Light theme",
      darkTheme: "Dark theme",
      logout: "Log out",
      logoutConfirmTitle: "Log out of your account?",
      logoutConfirmDescription: "You'll need to sign in again to continue.",
      profile: "Profile",
    },
    bottomNav: {
      more: "More",
      allSections: "All sections",
    },
    common: {
      cancel: "Cancel",
      save: "Save",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      close: "Close",
      back: "Back",
      next: "Next",
      actions: "Actions",
      loading: "Loading...",
      noPhoto: "No photo",
      chooseImage: "Choose image",
      generate: "Generate",
      copyPassword: "Copy password",
      passwordCopied: "Password copied",
      deleteQuestion: "Delete?",
      confirmDelete: "Yes, delete",
      name: "Name",
      city: "City",
      status: "Status",
      description: "Description",
      email: "Email",
      phone: "Phone",
      address: "Address",
      created: "Created",
      image: "Image",
      price: "Price, $/mo",
      statusActive: "Active",
      statusTrial: "Trial",
      statusSuspended: "Suspended",
      active: "Active",
      disabled: "Disabled",
      nothingFound: "Nothing found.",
      package: "Package",
      rowNumber: "#",
      pageSize: "Show:",
    },
    permissionsPicker: {
      filterPlaceholder: "Filter by category",
      selectAll: "Select all",
      otherModule: "Other",
      noPermissions: "No permissions available.",
      noResults: "Nothing found.",
    },
    permissionsPage: {
      title: "Permissions",
      searchPlaceholder: "Search groups and permissions",
      editGroup: "Edit group",
      editPermission: "Edit permission",
      editGroupTitle: "Edit permission group",
      editPermissionTitle: "Edit permission",
      code: "Code",
      toasts: {
        groupUpdated: "Group updated",
        permissionUpdated: "Permission updated",
      },
      errors: {
        loadPermissions: "Failed to load permissions",
        loadDetail: "Failed to load data",
        saveGroup: "Failed to save group",
        savePermission: "Failed to save permission",
      },
    },
    login: {
      lead: "Sign in to manage companies, tariffs and users.",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
      showPassword: "Show password",
      hidePassword: "Hide password",
      submit: "Sign in",
      fillFields: "Enter your email and password",
      loginFailed: "Failed to sign in",
      forgotTitle: "Password recovery",
      forgotEmailRequired: "Enter your email",
      forgotSuccess: "If the email exists, a password reset link has been sent to it",
      forgotFailed: "Failed to send the request",
      send: "Send",
      cancel: "Cancel",
    },
    overview: {
      title: "Platform overview",
      activeSuffix: "active",
      incomeMonth: "Income / mo",
      lastMonthPrefix: "last:",
      users: "Users",
      allTenants: "across all tenants",
      catalog: "catalog",
      recentCompanies: "Recent companies",
      viewAll: "View all",
      noCompanies: "No companies yet.",
      createTenant: "Create tenant",
    },
    companies: {
      title: "Companies",
      sub: "create and manage tenants",
      searchPlaceholder: "Search by name or city",
      newCompany: "+ New company",
      noCompaniesYet: "No companies yet.",
      createCompany: "Create company",
      tableCompany: "Company",
      tableUsers: "Users",
      isolationNote: "Company data is isolated. Each company operates only within its own package.",
      dialogTitle: "New company",
      created: "Company created",
      cityNotSelected: "No city selected",
      addressLang: (lang) => `Address (${lang})`,
      descriptionLang: (lang) => `Description (${lang})`,
      errors: {
        loadCompanies: "Failed to load companies",
        saveCompany: "Failed to save the company",
        savePhoto: "Company created, but the photo failed to upload",
      },
    },
    companyDetail: {
      notFoundTitle: "Company not found",
      notFoundText: "This company is no longer in the list.",
      backToList: "Back to companies",
      sub: "company profile",
      ownersTitle: "Owners",
      addOwner: "+ Add owner",
      noOwners: "No owners yet.",
      loginLabel: "Login:",
      fullName: "Full name",
      ownerModalTitleEdit: "Edit owner",
      ownerModalTitleCreate: "New owner",
      deleteCompanyTitle: "Delete company?",
      deleteCompanyDesc: (name) => `Delete company "${name}"? This action cannot be undone.`,
      ownerWillBeDeleted: "The owner will be deleted.",
      ownersCount: "Owners",
      subscriptionTitle: "Subscription",
      noSubscription: "No subscription yet.",
      noTariff: "No tariff selected",
      subscriptionStart: "Start date",
      subscriptionEnd: "End date",
      fromTariff: "Included in tariff",
      originalCost: "Original cost",
      toasts: {
        ownerSaved: "Owner saved",
        ownerAdded: "Owner added",
        ownerDeleted: "Owner deleted",
        companySaved: "Company saved",
        companyDeleted: "Company deleted",
        subscriptionSaved: "Subscription saved",
      },
      errors: {
        loadCompany: "Failed to load the company",
        saveCompany: "Failed to save the company",
        deleteCompany: "Failed to delete the company",
        saveSubscription: "Failed to save the subscription",
      },
    },
    users: {
      title: "Platform users",
      searchPlaceholder: "Search by name or email",
      newUser: "+ New user",
      noUsersYet: "No users yet.",
      createUser: "Create user",
      tableUser: "User",
      tableEmail: "Email",
      tableStatus: "Status",
      modalTitleCreate: "New user",
      firstName: "First name",
      lastName: "Last name",
      middleName: "Middle name",
      nickName: "Nickname",
      avatarUrl: "Avatar URL",
      userActive: "User is active",
      errors: { loadUsers: "Failed to load users", saveUser: "Failed to save user" },
      toasts: { created: "User created" },
    },
    userDetail: {
      notFoundTitle: "User not found",
      notFoundText: "This user does not exist or has been deleted.",
      backToList: "Back to users",
      sub: "user profile",
      assignedRoles: "Roles",
      noRolesAssigned: "No roles assigned.",
      manageRoles: "Manage roles",
      manageRolesTitle: "User roles",
      noRolesAvailable: "No roles have been created yet.",
      deleteUserTitle: "Delete user?",
      deleteUserDesc: (name: string) => `Delete user "${name}"? This action cannot be undone.`,
      errors: {
        saveUser: "Failed to save user",
        deleteUser: "Failed to delete user",
        loadRoles: "Failed to load roles",
      },
      toasts: {
        saved: "User saved",
        deleted: "User deleted",
        rolesUpdated: "Roles updated",
      },
    },
    profile: {
      sub: "my profile",
      changeAvatar: "Change photo",
      errors: { saveProfile: "Failed to save profile" },
      toasts: { saved: "Profile saved" },
    },
    packages: {
      title: "Packages",
      addPackage: "+ Add package",
      addPackageAction: "Add package",
      noPackagesYet: "No packages yet.",
      tablePrice: "Price",
      tablePermissionGroups: "Permission groups",
      modalTitleEdit: "Edit package",
      modalTitleCreate: "New package",
      nameLang: (lang) => `Name (${lang})`,
      descLang: (lang) => `Description (${lang})`,
      permissions: "Permissions",
      packageActive: "Package is active",
      deleteDesc: "The package will be permanently deleted.",
      errors: {
        loadPackages: "Failed to load packages",
        loadPermissions: "Failed to load permissions",
        loadPackagePermissions: "Failed to load package permissions",
        savePackage: "Failed to save the package",
        deletePackage: "Failed to delete the package",
      },
      toasts: { saved: "Package saved", created: "Package created", deleted: "Package deleted" },
    },
    packageDetail: {
      notFoundTitle: "Package not found",
      notFoundText: "This package is no longer in the list.",
      backToList: "Back to packages",
      sub: "package details",
      assignedPermissions: "Assigned permissions",
      noPermissionsAssigned: "No permissions assigned yet.",
      managePermissions: "Manage permissions",
      managePermissionsTitle: "Manage permissions",
      deletePackageTitle: "Delete package?",
      deletePackageDesc: (name) => `Delete package "${name}"? This action cannot be undone.`,
      toasts: {
        saved: "Package saved",
        deleted: "Package deleted",
        permissionsUpdated: "Permissions updated",
      },
    },
    roles: {
      title: "Roles",
      searchPlaceholder: "Search by role or code",
      addRole: "+ Add role",
      addRoleAction: "Add role",
      noRolesYet: "No roles created yet.",
      tableRole: "Role",
      tableCode: "Code",
      modalTitleCreate: "New role",
      code: "Role code",
      nameLang: (lang) => `Name (${lang})`,
      errors: { loadRoles: "Failed to load roles", saveRole: "Failed to save role" },
      toasts: { created: "Role created" },
    },
    roleDetail: {
      notFoundTitle: "Role not found",
      notFoundText: "This role is no longer in the list.",
      backToList: "Back to roles",
      sub: "role details",
      code: "Role code",
      assignedPermissions: "Assigned permissions",
      noPermissionsAssigned: "No permissions assigned yet.",
      managePermissions: "Manage permissions",
      managePermissionsTitle: "Manage role permissions",
      assignedUsers: "Users with this role",
      noUsersAssigned: "This role isn't assigned to anyone yet.",
      removeUserTitle: "Remove role from user?",
      removeUserDesc: (name) => `Remove this role from "${name}"?`,
      duplicateRole: "Duplicate",
      duplicateRoleTitle: "Duplicate role",
      duplicateRoleDesc: "Create a copy of this role with a new code and name. Permissions will be copied.",
      deleteRoleTitle: "Delete role?",
      deleteRoleDesc: (name) => `Delete role "${name}"? This action cannot be undone.`,
      errors: {
        saveRole: "Failed to save role",
        deleteRole: "Failed to delete role",
        loadPermissions: "Failed to load permissions",
        savePermissions: "Failed to save permissions",
        duplicateRole: "Failed to duplicate role",
        removeUser: "Failed to remove role from user",
      },
      toasts: {
        saved: "Role saved",
        deleted: "Role deleted",
        permissionsUpdated: "Permissions updated",
        duplicated: "Role duplicated",
        userRemoved: "Role removed from user",
      },
    },
    tariffs: {
      title: "Tariffs",
      addTariff: "+ Add tariff",
      addTariffAction: "Add tariff",
      noTariffsYet: "No tariff plans configured yet.",
      tableTariff: "Tariff",
      tablePackages: "Packages",
      perMonth: "/ mo",
      modalTitleEdit: "Edit tariff",
      modalTitleCreate: "New tariff",
      code: "Tariff code",
      packagesLabel: "Packages",
      choosePackage: "Choose a package…",
      descLang: (lang) => `Description (${lang})`,
      tariffActive: "Tariff is active",
      deleteTariffTitle: "Delete tariff?",
      deleteTariffDesc: (code) => `Delete tariff "${code}"? This action cannot be undone.`,
      errors: {
        loadTariffs: "Failed to load tariffs",
        loadPackages: "Failed to load packages",
        saveTariff: "Failed to save the tariff",
        deleteTariff: "Failed to delete the tariff",
      },
      toasts: { saved: "Tariff saved", created: "Tariff created", deleted: "Tariff deleted" },
    },
    cities: {
      title: "Cities",
      addCity: "+ Add city",
      noCitiesYet: "No cities yet.",
      addCityAction: "Add city",
      deleteDesc: "The city will be permanently deleted.",
      modalTitleEdit: "Edit city",
      modalTitleCreate: "New city",
      nameLang: (lang) => `Name (${lang})`,
      order: "Order",
      errors: {
        loadCities: "Failed to load cities",
        saveCity: "Failed to save the city",
        deleteCity: "Failed to delete the city",
      },
      toasts: {
        citySaved: "City saved",
        cityCreated: "City created",
        cityDeleted: "City deleted",
      },
    },
    activityLogs: {
      title: "Activity Log",
      filters: {
        entityId: "Entity ID",
        entityIdPlaceholder: "Enter entity ID",
        activityCode: "Activity type",
        activityCodePlaceholder: "Enter activity type",
        creator: "Creator",
        creatorPlaceholder: "Enter user name or ID",
        creatorSearching: "Searching...",
        creatorNotFound: "User not found",
        email: "Email",
        emailPlaceholder: "Enter email address",
        ipAddress: "IP address",
        ipAddressPlaceholder: "Enter IP address",
        serviceName: "Service name",
        serviceNamePlaceholder: "Enter service name",
        sessionId: "Session ID",
        sessionIdPlaceholder: "Enter session ID",
        requestId: "Request ID",
        requestIdPlaceholder: "Enter request ID",
        type: "Type",
        typeNotSelected: "Not selected",
        period: "Time range",
        periodFrom: "Period start",
        periodTo: "Period end",
        toggle: "All filters",
      },
      types: {
        created: "Created",
        updated: "Updated",
        deleted: "Deleted",
        viewed: "Viewed",
      },
      tableCreator: "Creator name",
      tableActivity: "Activity type",
      tableType: "Type",
      tableService: "Service name",
      tableCreatedAt: "Created at",
      noLogsYet: "No records found.",
      detail: {
        activityType: "Activity type",
        code: "Code",
        action: "Action",
        creator: "Creator",
        email: "Email",
        ipAddress: "IP address",
        date: "Date",
        createdAtTime: (time) => `Created at ${time}`,
        entityType: "Entity type",
        systemName: "Service name",
        id: "ID",
        entityId: "Entity ID",
        sessionId: "Session ID",
        requestId: "Request ID",
        data: "Data",
        notAvailable: "—",
        copied: "Copied",
        notFound: "Record not found.",
      },
      errors: { loadLogs: "Failed to load the activity log", loadDetail: "Failed to load the record" },
    },
    resetPassword: {
      lead: "Come up with a new sign-in password.",
      invalidLink: "The link is invalid or expired. Request a password reset again.",
      newPassword: "New password",
      repeatPassword: "Repeat password",
      submit: "Save password",
      errors: {
        missingToken: "The link is invalid: token is missing",
        mismatch: "Passwords do not match",
        empty: "Enter a new password",
        failed: "Failed to change the password",
      },
      success: "Password changed, sign in with the new password",
    },
  },
  tj: {
    nav: {
      group: "Платформа",
      overview: "Асосӣ",
      companies: "Ширкатҳо",
      tariffs: "Тарифҳо",
      packages: "Бастаҳо",
      users: "Корбарон",
      cities: "Шаҳрҳо",
      permissions: "Ҳуқуқҳои дастрасӣ",
      roles: "Нақшҳо",
      activityLogs: "Рӯзномаи фаъолият",
    },
    titles: {
      companyDetail: "Ширкат",
      packageDetail: "Баста",
      roleDetail: "Нақш",
      dashboard: "Панели идоракунӣ",
    },
    sidebar: {
      lightTheme: "Мавзӯи равшан",
      darkTheme: "Мавзӯи торик",
      logout: "Баромадан",
      logoutConfirmTitle: "Аз ҳисоб мебароед?",
      logoutConfirmDescription: "Барои идома додан бояд дубора ворид шавед.",
      profile: "Профил",
    },
    bottomNav: {
      more: "Бештар",
      allSections: "Ҳамаи бахшҳо",
    },
    common: {
      cancel: "Бекор кардан",
      save: "Захира кардан",
      create: "Эҷод кардан",
      edit: "Таҳрир кардан",
      delete: "Нест кардан",
      close: "Пӯшидан",
      back: "Бозгашт",
      next: "Баъдӣ",
      actions: "Амалҳо",
      loading: "Боргирӣ...",
      noPhoto: "Акс нест",
      chooseImage: "Интихоби расм",
      generate: "Тавлид кардан",
      copyPassword: "Нусхабардории парол",
      passwordCopied: "Парол нусхабардорӣ шуд",
      deleteQuestion: "Нест кардан?",
      confirmDelete: "Ҳа, нест кардан",
      name: "Ном",
      city: "Шаҳр",
      status: "Ҳолат",
      description: "Тавсиф",
      email: "Email",
      phone: "Телефон",
      address: "Суроға",
      created: "Сохта шуд",
      image: "Расм",
      price: "Нарх, $/моҳ",
      statusActive: "Фаъол",
      statusTrial: "Озмоишӣ",
      statusSuspended: "Боздошта шуда",
      active: "Фаъол",
      disabled: "Ғайрифаъол",
      nothingFound: "Чизе ёфт нашуд.",
      package: "Баста",
      rowNumber: "№",
      pageSize: "Нишон додан:",
    },
    permissionsPicker: {
      filterPlaceholder: "Аз рӯи категория филтр кунед",
      selectAll: "Ҳамаро интихоб кунед",
      otherModule: "Дигар",
      noPermissions: "Ҳуқуқи дастрасӣ мавҷуд нест.",
      noResults: "Чизе ёфт нашуд.",
    },
    permissionsPage: {
      title: "Ҳуқуқҳои дастрасӣ",
      searchPlaceholder: "Ҷустуҷӯ дар гурӯҳҳо ва ҳуқуқҳо",
      editGroup: "Таҳрири гурӯҳ",
      editPermission: "Таҳрири ҳуқуқ",
      editGroupTitle: "Таҳрири гурӯҳи ҳуқуқҳо",
      editPermissionTitle: "Таҳрири ҳуқуқ",
      code: "Код",
      toasts: {
        groupUpdated: "Гурӯҳ навсозӣ шуд",
        permissionUpdated: "Ҳуқуқ навсозӣ шуд",
      },
      errors: {
        loadPermissions: "Ҳуқуқҳоро бор карда натавонист",
        loadDetail: "Маълумотро бор карда натавонист",
        saveGroup: "Гурӯҳро захира карда натавонист",
        savePermission: "Ҳуқуқро захира карда натавонист",
      },
    },
    login: {
      lead: "Барои идоракунии ширкатҳо, тарифҳо ва корбарон ворид шавед.",
      email: "Email",
      password: "Парол",
      forgotPassword: "Паролро фаромӯш кардед?",
      showPassword: "Паролро нишон диҳед",
      hidePassword: "Паролро пинҳон кунед",
      submit: "Ворид шудан",
      fillFields: "Email ва паролро ворид кунед",
      loginFailed: "Ворид шудан имконнопазир аст",
      forgotTitle: "Барқарорсозии парол",
      forgotEmailRequired: "Email-ро ворид кунед",
      forgotSuccess: "Агар email мавҷуд бошад, ба он пайванди барқарорсозии парол фиристода шуд",
      forgotFailed: "Дархостро фиристодан имконнопазир аст",
      send: "Фиристодан",
      cancel: "Бекор кардан",
    },
    overview: {
      title: "Дурнамои платформа",
      activeSuffix: "фаъол",
      incomeMonth: "Даромад / моҳ",
      lastMonthPrefix: "пешина:",
      users: "Корбарон",
      allTenants: "дар ҳамаи тенантҳо",
      catalog: "феҳрист",
      recentCompanies: "Ширкатҳои охирин",
      viewAll: "Ҳама",
      noCompanies: "Ҳанӯз ширкате нест.",
      createTenant: "Эҷоди тенант",
    },
    companies: {
      title: "Ширкатҳо",
      sub: "эҷод ва идоракунии тенантҳо",
      searchPlaceholder: "Ҷустуҷӯ аз рӯи ном ё шаҳр",
      newCompany: "+ Ширкати нав",
      noCompaniesYet: "Ҳанӯз ширкате нест.",
      createCompany: "Эҷоди ширкат",
      tableCompany: "Ширкат",
      tableUsers: "Корбарон",
      isolationNote: "Маълумоти ширкатҳо ҷудо карда шудаанд. Ҳар ширкат танҳо дар доираи бастаи худ кор мекунад.",
      dialogTitle: "Ширкати нав",
      created: "Ширкат эҷод шуд",
      cityNotSelected: "Шаҳр интихоб нашудааст",
      addressLang: (lang) => `Суроға (${lang})`,
      descriptionLang: (lang) => `Тавсиф (${lang})`,
      errors: {
        loadCompanies: "Боргирии рӯйхати ширкатҳо ноком шуд",
        saveCompany: "Захираи ширкат ноком шуд",
        savePhoto: "Ширкат эҷод шуд, аммо боргирии акс ноком шуд",
      },
    },
    companyDetail: {
      notFoundTitle: "Ширкат ёфт нашуд",
      notFoundText: "Чунин ширкат дигар дар рӯйхат нест.",
      backToList: "Ба рӯйхати ширкатҳо",
      sub: "корти ширкат",
      ownersTitle: "Соҳибон",
      addOwner: "+ Илова кардани соҳиб",
      noOwners: "Ҳанӯз соҳибе нест.",
      loginLabel: "Логин:",
      fullName: "Ному насаб",
      ownerModalTitleEdit: "Таҳрири соҳиб",
      ownerModalTitleCreate: "Соҳиби нав",
      deleteCompanyTitle: "Ширкатро нест кардан?",
      deleteCompanyDesc: (name) => `Ширкати «${name}»-ро нест кардан? Ин амал баргарданашаванда аст.`,
      ownerWillBeDeleted: "Соҳиб нест карда мешавад.",
      ownersCount: "Соҳибон",
      subscriptionTitle: "Обуна",
      noSubscription: "Обуна ҳанӯз танзим нашудааст.",
      noTariff: "Тариф интихоб нашудааст",
      subscriptionStart: "Санаи оғоз",
      subscriptionEnd: "Санаи анҷом",
      fromTariff: "Дар тариф дохил аст",
      originalCost: "Арзиши аслӣ",
      toasts: {
        ownerSaved: "Соҳиб захира шуд",
        ownerAdded: "Соҳиб илова шуд",
        ownerDeleted: "Соҳиб нест карда шуд",
        companySaved: "Ширкат захира шуд",
        companyDeleted: "Ширкат нест карда шуд",
        subscriptionSaved: "Обуна захира шуд",
      },
      errors: {
        loadCompany: "Боргирии ширкат ноком шуд",
        saveCompany: "Захираи ширкат ноком шуд",
        deleteCompany: "Несткунии ширкат ноком шуд",
        saveSubscription: "Захираи обуна ноком шуд",
      },
    },
    users: {
      title: "Корбарони платформа",
      searchPlaceholder: "Ҷустуҷӯ аз рӯи ном ё email",
      newUser: "+ Корбари нав",
      noUsersYet: "Ҳанӯз корбаре нест.",
      createUser: "Эҷоди корбар",
      tableUser: "Корбар",
      tableEmail: "Email",
      tableStatus: "Ҳолат",
      modalTitleCreate: "Корбари нав",
      firstName: "Ном",
      lastName: "Насаб",
      middleName: "Номи падар",
      nickName: "Тахаллус",
      avatarUrl: "Пайванди аватар",
      userActive: "Корбар фаъол аст",
      errors: { loadUsers: "Боргирии корбарон ноком шуд", saveUser: "Захираи корбар ноком шуд" },
      toasts: { created: "Корбар эҷод шуд" },
    },
    userDetail: {
      notFoundTitle: "Корбар ёфт нашуд",
      notFoundText: "Ин корбар вуҷуд надорад ё нест карда шудааст.",
      backToList: "Ба рӯйхати корбарон",
      sub: "профили корбар",
      assignedRoles: "Нақшҳо",
      noRolesAssigned: "Нақш таъин нашудааст.",
      manageRoles: "Идоракунии нақшҳо",
      manageRolesTitle: "Нақшҳои корбар",
      noRolesAvailable: "Ҳанӯз нақше эҷод нашудааст.",
      deleteUserTitle: "Корбарро нест кунам?",
      deleteUserDesc: (name: string) => `Корбари «${name}»-ро нест кунам? Ин амал бебозгашт аст.`,
      errors: {
        saveUser: "Захираи корбар ноком шуд",
        deleteUser: "Несткунии корбар ноком шуд",
        loadRoles: "Боргирии нақшҳо ноком шуд",
      },
      toasts: {
        saved: "Корбар захира шуд",
        deleted: "Корбар нест карда шуд",
        rolesUpdated: "Нақшҳо навсозӣ шуданд",
      },
    },
    profile: {
      sub: "профили ман",
      changeAvatar: "Тасвирро иваз кунед",
      errors: { saveProfile: "Захираи профил ноком шуд" },
      toasts: { saved: "Профил захира шуд" },
    },
    packages: {
      title: "Бастаҳо",
      addPackage: "+ Иловаи баста",
      addPackageAction: "Иловаи баста",
      noPackagesYet: "Ҳанӯз баста нест.",
      tablePrice: "Нарх",
      tablePermissionGroups: "Гурӯҳҳои ҳуқуқ",
      modalTitleEdit: "Таҳрири баста",
      modalTitleCreate: "Бастаи нав",
      nameLang: (lang) => `Ном (${lang})`,
      descLang: (lang) => `Тавсиф (${lang})`,
      permissions: "Ҳуқуқҳои дастрасӣ",
      packageActive: "Баста фаъол аст",
      deleteDesc: "Баста бе имконияти барқарорсозӣ нест карда мешавад.",
      errors: {
        loadPackages: "Боргирии бастаҳо ноком шуд",
        loadPermissions: "Боргирии ҳуқуқҳои дастрасӣ ноком шуд",
        loadPackagePermissions: "Боргирии ҳуқуқҳои баста ноком шуд",
        savePackage: "Захираи баста ноком шуд",
        deletePackage: "Нест кардани баста ноком шуд",
      },
      toasts: { saved: "Баста захира шуд", created: "Баста эҷод шуд", deleted: "Баста нест карда шуд" },
    },
    packageDetail: {
      notFoundTitle: "Баста ёфт нашуд",
      notFoundText: "Чунин баста дигар дар рӯйхат нест.",
      backToList: "Ба рӯйхати бастаҳо",
      sub: "маълумоти баста",
      assignedPermissions: "Ҳуқуқҳои таъиншуда",
      noPermissionsAssigned: "Ҳанӯз ҳуқуқе таъин нашудааст.",
      managePermissions: "Идоракунии ҳуқуқҳо",
      managePermissionsTitle: "Идоракунии ҳуқуқҳо",
      deletePackageTitle: "Бастаро нест кардан?",
      deletePackageDesc: (name) => `Бастаи «${name}»-ро нест кардан? Ин амал баргарданашаванда аст.`,
      toasts: {
        saved: "Баста захира шуд",
        deleted: "Баста нест карда шуд",
        permissionsUpdated: "Ҳуқуқҳо навсозӣ шуданд",
      },
    },
    roles: {
      title: "Нақшҳо",
      searchPlaceholder: "Ҷустуҷӯ аз рӯи нақш ё код",
      addRole: "+ Иловаи нақш",
      addRoleAction: "Иловаи нақш",
      noRolesYet: "Ҳанӯз нақше эҷод нашудааст.",
      tableRole: "Нақш",
      tableCode: "Код",
      modalTitleCreate: "Нақши нав",
      code: "Коди нақш",
      nameLang: (lang) => `Ном (${lang})`,
      errors: { loadRoles: "Нақшҳоро бор карда натавонист", saveRole: "Нақшро захира карда натавонист" },
      toasts: { created: "Нақш эҷод шуд" },
    },
    roleDetail: {
      notFoundTitle: "Нақш ёфт нашуд",
      notFoundText: "Чунин нақш дигар дар рӯйхат нест.",
      backToList: "Ба рӯйхати нақшҳо",
      sub: "маълумоти нақш",
      code: "Коди нақш",
      assignedPermissions: "Ҳуқуқҳои таъиншуда",
      noPermissionsAssigned: "Ҳанӯз ҳуқуқе таъин нашудааст.",
      managePermissions: "Идоракунии ҳуқуқҳо",
      managePermissionsTitle: "Идоракунии ҳуқуқҳои нақш",
      assignedUsers: "Корбарони соҳиби ин нақш",
      noUsersAssigned: "Ин нақш ҳанӯз ба ҳеҷ кас таъин нашудааст.",
      removeUserTitle: "Нақшро аз корбар гирем?",
      removeUserDesc: (name) => `Нақшро аз «${name}» гирем?`,
      duplicateRole: "Нусхабардорӣ",
      duplicateRoleTitle: "Нусхабардории нақш",
      duplicateRoleDesc: "Нусхаи нақшро бо коду номи нав эҷод кунед. Ҳуқуқҳо низ нусха бардошта мешаванд.",
      deleteRoleTitle: "Нақшро нест кардан?",
      deleteRoleDesc: (name) => `Нақши «${name}»-ро нест кардан? Ин амал баргарданашаванда аст.`,
      errors: {
        saveRole: "Нақшро захира карда натавонист",
        deleteRole: "Нақшро нест карда натавонист",
        loadPermissions: "Ҳуқуқҳоро бор карда натавонист",
        savePermissions: "Ҳуқуқҳоро захира карда натавонист",
        duplicateRole: "Нақшро нусхабардорӣ карда натавонист",
        removeUser: "Нақшро аз корбар гирифта натавонист",
      },
      toasts: {
        saved: "Нақш захира шуд",
        deleted: "Нақш нест карда шуд",
        permissionsUpdated: "Ҳуқуқҳо навсозӣ шуданд",
        duplicated: "Нақш нусхабардорӣ шуд",
        userRemoved: "Нақш аз корбар гирифта шуд",
      },
    },
    tariffs: {
      title: "Тарифҳо",
      addTariff: "+ Иловаи тариф",
      addTariffAction: "Иловаи тариф",
      noTariffsYet: "Нақшаҳои тарифӣ ҳанӯз танзим нашудаанд.",
      tableTariff: "Тариф",
      tablePackages: "Бастаҳо",
      perMonth: "/ моҳ",
      modalTitleEdit: "Таҳрири тариф",
      modalTitleCreate: "Тарифи нав",
      code: "Коди тариф",
      packagesLabel: "Бастаҳо",
      choosePackage: "Бастаро интихоб кунед…",
      descLang: (lang) => `Тавсиф (${lang})`,
      tariffActive: "Тариф фаъол аст",
      deleteTariffTitle: "Тарифро нест кардан?",
      deleteTariffDesc: (code) => `Тарифи «${code}»-ро нест кардан? Ин амал баргарданашаванда аст.`,
      errors: {
        loadTariffs: "Боргирии тарифҳо ноком шуд",
        loadPackages: "Боргирии бастаҳо ноком шуд",
        saveTariff: "Захираи тариф ноком шуд",
        deleteTariff: "Нест кардани тариф ноком шуд",
      },
      toasts: { saved: "Тариф захира шуд", created: "Тариф эҷод шуд", deleted: "Тариф нест карда шуд" },
    },
    cities: {
      title: "Шаҳрҳо",
      addCity: "+ Иловаи шаҳр",
      noCitiesYet: "Ҳанӯз шаҳре нест.",
      addCityAction: "Иловаи шаҳр",
      deleteDesc: "Шаҳр бебозгашт нест карда мешавад.",
      modalTitleEdit: "Таҳрири шаҳр",
      modalTitleCreate: "Шаҳри нав",
      nameLang: (lang) => `Ном (${lang})`,
      order: "Тартиб",
      errors: {
        loadCities: "Боргирии шаҳрҳо ноком шуд",
        saveCity: "Захираи шаҳр ноком шуд",
        deleteCity: "Несткунии шаҳр ноком шуд",
      },
      toasts: {
        citySaved: "Шаҳр захира шуд",
        cityCreated: "Шаҳр эҷод шуд",
        cityDeleted: "Шаҳр нест карда шуд",
      },
    },
    activityLogs: {
      title: "Рӯзномаи фаъолият",
      filters: {
        entityId: "ID-и объект",
        entityIdPlaceholder: "ID-и объектро ворид кунед",
        activityCode: "Навъи фаъолият",
        activityCodePlaceholder: "Навъи фаъолиятро ворид кунед",
        creator: "Эҷодкунанда",
        creatorPlaceholder: "Номи корбар ё ID-ро ворид кунед",
        creatorSearching: "Ҷустуҷӯ...",
        creatorNotFound: "Корбар ёфт нашуд",
        email: "Email",
        emailPlaceholder: "Суроғаи email-ро ворид кунед",
        ipAddress: "Суроғаи IP",
        ipAddressPlaceholder: "Суроғаи IP-ро ворид кунед",
        serviceName: "Номи хидмат",
        serviceNamePlaceholder: "Номи хидматро ворид кунед",
        sessionId: "Идентификатори сессия",
        sessionIdPlaceholder: "Идентификатори сессияро ворид кунед",
        requestId: "Идентификатори дархост",
        requestIdPlaceholder: "Идентификатори дархостро ворид кунед",
        type: "Навъ",
        typeNotSelected: "Интихоб нашудааст",
        period: "Давраи амал",
        periodFrom: "Огози давра",
        periodTo: "Охири давра",
        toggle: "Ҳамаи филтрҳо",
      },
      types: {
        created: "Эҷод шуд",
        updated: "Навсозӣ шуд",
        deleted: "Нест карда шуд",
        viewed: "Дида шуд",
      },
      tableCreator: "Номи эҷодкунанда",
      tableActivity: "Номи навъи фаъолият",
      tableType: "Навъ",
      tableService: "Номи хидмат",
      tableCreatedAt: "Санаи эҷод",
      noLogsYet: "Сабт ёфт нашуд.",
      detail: {
        activityType: "Навъи фаъолият",
        code: "Код",
        action: "Амал",
        creator: "Эҷодкунанда",
        email: "Email",
        ipAddress: "Суроғаи IP",
        date: "Сана",
        createdAtTime: (time) => `Санаи эҷод дар ${time}`,
        entityType: "Навъи объект",
        systemName: "Номи хидмат",
        id: "ID",
        entityId: "ID-и объект",
        sessionId: "Идентификатори сессия",
        requestId: "Идентификатори дархост",
        data: "Маълумот",
        notAvailable: "—",
        copied: "Нусхабардорӣ шуд",
        notFound: "Сабт ёфт нашуд.",
      },
      errors: { loadLogs: "Боргирии рӯзномаи фаъолият ноком шуд", loadDetail: "Боргирии сабт ноком шуд" },
    },
    resetPassword: {
      lead: "Барои воридшавӣ пароли нави худро таъин кунед.",
      invalidLink: "Пайванд эътибор надорад ё кӯҳна шудааст. Барқарорсозии паролро аз нав дархост кунед.",
      newPassword: "Пароли нав",
      repeatPassword: "Паролро такрор кунед",
      submit: "Паролро захира кунед",
      errors: {
        missingToken: "Пайванд эътибор надорад: токен мавҷуд нест",
        mismatch: "Паролҳо мувофиқат намекунанд",
        empty: "Пароли навро ворид кунед",
        failed: "Тағйири парол ноком шуд",
      },
      success: "Парол тағйир ёфт, бо пароли нав ворид шавед",
    },
  },
};
