local function absolute_flags(flags, pathflags, rootdir)
    rootdir = rootdir or os.projectdir()

    local enabled = {}
    for _, flag in ipairs(pathflags) do
        enabled[flag] = true
    end

    local result = {}
    local i = 1

    while i <= #flags do
        local flag = flags[i]
        local handled = false

        if enabled[flag] and flags[i + 1] then
            table.insert(result, flag)
            table.insert(result, path.absolute(flags[i + 1], rootdir))
            i = i + 2
            handled = true
        end

        if not handled then
            for prefix, _ in pairs(enabled) do
                if #flag > #prefix and flag:sub(1, #prefix) == prefix then
                    local value = flag:sub(#prefix + 1)
                    table.insert(result, prefix .. path.absolute(value, rootdir))
                    i = i + 1
                    handled = true
                    break
                end
            end
        end

        if not handled then
            table.insert(result, flag)
            i = i + 1
        end
    end

    return result
end

local function go_quote_arg(arg)
    if not arg:find("[%s'\"]") then
        return arg
    end

    if not arg:find("'") then
        return "'" .. arg .. "'"
    end

    if not arg:find('"') then
        return '"' .. arg .. '"'
    end

    raise("cannot quote Go argument containing both single and double quotes: " .. arg)
end

local function go_args(args)
    local result = {}
    for _, arg in ipairs(args) do
        table.insert(result, go_quote_arg(arg))
    end
    return table.concat(result, " ")
end

local function add_konsupujs_cache_key(target, envs)
    local konsupujs = assert(target:dep("konsupujs"))
    local archive = konsupujs:targetfile()

    if not os.isfile(archive) then
        return
    end

    local digest = hash.sha256(archive)

    -- This macro is intentionally unused.
    -- Its only purpose is to make the external archive content
    -- part of Go's cgo build action key.
    local flag = "-DKONSUPUJS_ARCHIVE_" .. digest .. "=1"

    local old = envs.CGO_CPPFLAGS or ""
    envs.CGO_CPPFLAGS =
        (old ~= "" and (old .. " ") or "") .. flag
end

function goenvarg(target)
    local go_archs = {i386 = "386", x86_64 = "amd64", armv7 = "arm", arm64 = "arm64"}
    local go_os = target:plat() == "mingw" and "windows" or target:plat()
    local go_arch = go_archs[target:arch()]
    if not go_arch then raise("unsupported Go arch") end

    import("core.tool.linker")
    local linkinst, errors = linker.load("binary", {"cc"}, target)
    if not linkinst then
        raise(errors)
    end
    local linkflags = linkinst:linkflags({target = target, targetkind = "binary"})
    table.join2(linkflags, target:toolconfig("ldflags") or {})

    import("core.tool.compiler")
    local cc = target:compiler("cc")
    local cflags = cc:compflags({target = target, targetkind = "object"})

    local environment = {
        GOOS = go_os,
        GOARCH = go_arch,
        CGO_ENABLED = "1",
        CC = target:tool("cc"),
        CXX = target:tool("cxx"),
        CGO_CFLAGS = go_args(absolute_flags(cflags, {"-I"}))
    }
    if go_arch == "amd64" then
        environment.GOAMD64 = get_config("enable_x86_64_v3") and "v3" or "v1"
    elseif go_arch == "arm" then
        environment.GOARM = "7"
    end
    add_konsupujs_cache_key(target, environment)

    return environment, {
        "-ldflags",
        "-extldflags " .. go_quote_arg(go_args(absolute_flags(linkflags, {"-L"}))),
    }
end