require "rubygems"
require "bundler/setup"

file "lib/handlebars/parser.js" => ["src/handlebars.yy","src/handlebars.l"] do
  system "jison src/handlebars.yy src/handlebars.l"
  sh "mv handlebars.js lib/handlebars/parser.js"
end

task :compile => "lib/handlebars/parser.js"

desc "run the spec suite"
task :spec => [:release] do
  system "rspec -cfs spec"
end

task :default => [:compile, :spec]

def remove_exports(string)
  match = string.match(%r{^// BEGIN\(BROWSER\)\n(.*)\n^// END\(BROWSER\)}m)
  match ? match[1] : string
end

minimal_deps = %w(parser base ast visitor runtime utils vm).map do |file|
  "lib/handlebars/#{file}.js"
end

debug_deps = %w(parser base ast visitor printer runtime utils vm).map do |file|
  "lib/handlebars/#{file}.js"
end

minimal_deps << "lib/handlebars.js"
debug_deps   << "lib/handlebars.js" << "lib/handlebars/debug.js"

minimal_deps.unshift "dist"
debug_deps.unshift   "dist"

def build_for_task(task)
  FileUtils.rm_rf("dist/*") if File.directory?("dist")
  FileUtils.mkdir_p("dist")

  contents = []
  task.prerequisites.each do |filename|
    next if filename == "dist"

    contents << "// #{filename}\n" + remove_exports(File.read(filename)) + ";"
  end

  File.open(task.name, "w") do |file|
    file.puts contents.join("\n")
  end
end

file "dist/handlebars.js" => minimal_deps do |task|
  build_for_task(task)
end

file "dist/handlebars.debug.js" => debug_deps do |task|
  build_for_task(task)
end

task :build => [:compile, "dist/handlebars.js"]
task :debug => [:compile, "dist/handlebars.debug.js"]

desc "build the build and debug versions of handlebars"
task :release => [:build, :debug]

desc "benchmark against dust.js and mustache.js"
task :bench do
  require "open-uri"
  File.open("vendor/mustache.js", "w") do |file|
    file.puts open("https://github.com/janl/mustache.js/raw/master/mustache.js").read
    file.puts "module.exports = Mustache;"
  end

  File.open("vendor/benchmark.js", "w") do |file|
    file.puts open("https://github.com/mathiasbynens/benchmark.js/raw/master/benchmark.js").read
  end

  if File.directory?("vendor/dustjs")
    system "cd vendor/dustjs && git pull"
  else
    system "git clone git://github.com/akdubya/dustjs.git vendor/dustjs"
  end

  system "node bench/handlebars.js"
end
