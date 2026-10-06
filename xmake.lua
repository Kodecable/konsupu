set_project("konsupu")
set_version("0.9.0")
-- set_policy("package.requires_lock", true)

set_toolchains("zigcc")

add_requires("quickjs-ng 0.15.1", {system = false, configs = {libc = false}})
add_requires("cmocka 1.1.7", {system = false})

add_rules("mode.debug", "mode.release")
if is_mode("debug") then
    set_symbols("debug")
    set_optimize("none")
end

option("enable_x86_64_v3")
    set_default(false)
    set_showmenu(true)
option_end()

if get_config("enable_x86_64_v3") == true and is_arch("x86_64") then
    add_cflags("-march=x86_64_v3", {force = true})
end

-- zig not support
add_cflags("-fno-sanitize=undefined", {force = true})

target("konsupujs")
    set_kind("static")
    add_packages("quickjs-ng")
    
    add_cflags(
        "-Wall",
        "-Wextra",
        "-Wpedantic",
        "-Wshadow",
        "-Wconversion",
        "-Wno-gnu-line-marker",
        {force = true}
    )
    add_defines("KJS_BUILD")

    add_includedirs("src/konsupujs/include", {public = true})
    add_includedirs("src/konsupujs/internal")
    add_files("src/konsupujs/src/*.c")
    
    if is_plat("linux", "bsd") then
        add_syslinks("m", "pthread", "dl", {public = true})
    elseif is_plat("mingw") then
        add_syslinks("ws2_32", "crypt32", "advapi32", {public = true})
    end

target("konsupujs_tests")
    set_kind("binary")
    set_default(false)
    add_deps("konsupujs")
    add_includedirs("src/konsupujs/internal")
    add_files("src/konsupujs/tests/*.c")
    add_packages("cmocka", "quickjs-ng")
    add_tests("unit")
    on_test(function (target)
        os.vrunv(target:targetfile())
        return true
    end)

target("konsupurt")
    set_kind("phony")
    set_default(true)
    add_deps("konsupujs")

    on_build(function (target, opt)
        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs, args = konsupurt.goenvarg(target)

        local directory = path.join(os.projectdir(), target:targetdir())
        local output = path.join(directory, "konsupu" .. (target:is_plat("mingw") and ".exe" or ""))
        os.mkdir(directory)

        import("utils.progress")
        progress.show(opt.progress, "${color.build.target}building.go %s", target:name())

        os.vrunv("go", 
            table.join(
                {"build", "-o", output, "-buildvcs=false", "-x", "-work"},
                args,
                {"."}
            ), 
            {curdir = path.join(os.projectdir(), "src", "konsupurt"), envs = envs}
        )
    end)

    on_run(function (target)
        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs, args = konsupurt.goenvarg(target)
        
        args = table.join({"run"}, args, {"."}, target:get("runargs"))
        os.execv("go", args, {
            curdir = path.join(os.projectdir(), "src", "konsupurt"), envs = envs
        })
    end)

    on_clean(function (target) 
        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs, args = konsupurt.goenvarg(target)
        
        args = table.join({"clean", "-cache", "-testcache"}, args)
        os.execv("go", args, {
            curdir = path.join(os.projectdir(), "src", "konsupurt"), envs = envs
        })
    end)

    add_tests("go-test")
    on_test(function (target)
        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs, args = konsupurt.goenvarg(target)

        os.vrunv("go", table.join({"test", "-count=1"}, args, {"./..."}), {
            curdir = path.join(os.projectdir(), "src", "konsupurt"), envs = envs
        })
        return true
    end)

task("go_env")
    set_menu {
        usage = "xmake go_env",
        description = "Print Go environment as JSON for konsupurt (for IDE)",
        options = {}
    }

    on_run(function ()
        import("core.base.task")
        import("core.project.project")
        import("core.base.json")
        task.run("config", {}, {disable_dump = true})
        local target = project.target("konsupurt")

        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs = konsupurt.goenvarg(target)

        -- not xmake's wrapper
        envs.CC = "zig cc"
        envs.CXX = "zig c++"

        print(json.encode(envs))
    end)

task("go_env_run")
    set_menu {
        usage = "xmake go_env_run -- PROGRAM [ARGS...]",
        description = "Run program in konsupurt go envs, and konsupurt workdir",
        options = {
            {nil, "args", "vs", nil, "Arguments"}
        }
    }

    on_run(function ()
        import("core.base.task")
        import("core.project.project")
        import("core.base.json")
        task.run("config", {}, {disable_dump = true})
        local target = project.target("konsupurt")

        local konsupurt = import("konsupurt", {
            rootdir = path.join(os.projectdir(), "src/konsupurt"),
            anonymous = true
        })
        local envs = konsupurt.goenvarg(target)

        import("core.base.option")
        args = option.get("args") or {}
        if #args < 1 then 
            raise("missing PROGRAM")
        end

        os.execv(args[1], {table.unpack(args, 2)}, {
            curdir = path.join(os.projectdir(), "src", "konsupurt"), envs = envs
        })
    end)
-- Assemble the Commons cognition space: the Foundation source with the
-- src/commons overlay on top. The overlay adds its own files and may replace
-- only the Foundation domain entries it implements and the root Test.js.
task("commons_space")
    set_menu {
        usage = "xmake commons_space",
        description = "Assemble build/commons-space from src/foundation and src/commons",
        options = {}
    }

    on_run(function ()
        local root = os.projectdir()
        local foundation = path.join(root, "src", "foundation")
        local overlay = path.join(root, "src", "commons")
        local space = path.join(root, "build", "commons-space")
        local replaceable = {
            ["Memory/ValidateInput.js"] = true,
            ["Memory/ResolveQuery.js"] = true,
            ["Memory/ResolveQueryDefer.js"] = true,
            ["Test.js"] = true,
        }
        os.tryrm(space)
        os.mkdir(space)
        for _, name in ipairs({"Memory", "Interface", "Test", "Resolve.js", "Test.js"}) do
            os.cp(path.join(foundation, name), path.join(space, name))
        end
        for _, file in ipairs(os.files(path.join(overlay, "**"))) do
            local relative = path.relative(file, overlay):gsub("\\", "/")
            local target = path.join(space, relative)
            local marker = path.filename(file) == ".konsupu-directory"
            if os.isfile(target) and not marker and not replaceable[relative] then
                raise("src/commons must not replace Foundation file " .. relative)
            end
            os.cp(file, target)
        end
        -- Every cognition directory needs its marker, hidden or not listed.
        for _, dir in ipairs(os.dirs(path.join(overlay, "**"))) do
            local target = path.join(space, path.relative(dir, overlay))
            local marker = path.join(target, ".konsupu-directory")
            if not os.isfile(marker) then
                io.writefile(marker, "")
            end
        end
        print("assembled %s", space)
    end)
