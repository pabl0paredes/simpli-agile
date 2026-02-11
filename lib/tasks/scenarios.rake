# lib/tasks/scenarios.rake
namespace :scenarios do
  desc "Crea escenario base para una municipalidad"
  task :bootstrap, [:municipality_code] => :environment do |t, args|
    raise "municipality_code requerido" unless args[:municipality_code]

    system_user = User.find_by!(email: "system@simpli.cl")

    scenario = Scenario.find_or_create_by!(
      name: "Escenario base",
      municipality_code: args[:municipality_code],
      user_id: system_user.id
    )

    puts "✔ Escenario base listo (id=#{scenario.id})"
  end
end
