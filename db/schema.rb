# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_19_182207) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "accessibilities", force: :cascade do |t|
    t.string "h3", null: false
    t.bigint "travel_mode_id", null: false
    t.string "accessibility_type"
    t.string "opportunity_code", null: false
    t.bigint "scenario_id", null: false
    t.float "value"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["h3"], name: "index_accessibilities_on_h3"
    t.index ["opportunity_code"], name: "index_accessibilities_on_opportunity_code"
    t.index ["scenario_id", "travel_mode_id", "opportunity_code", "accessibility_type"], name: "idx_accessibilities_query"
    t.index ["scenario_id"], name: "index_accessibilities_on_scenario_id"
    t.index ["travel_mode_id"], name: "index_accessibilities_on_travel_mode_id"
  end

  create_table "availabilities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "municipality_code", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["municipality_code"], name: "index_availabilities_on_municipality_code"
    t.index ["user_id"], name: "index_availabilities_on_user_id"
  end

  create_table "cells", primary_key: "h3", id: :string, force: :cascade do |t|
    t.geometry "geometry", limit: {:srid=>4326, :type=>"geometry"}
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.integer "municipality_code", null: false
    t.integer "show_id"
    t.index ["geometry"], name: "index_cells_on_geometry", using: :gist
  end

  create_table "info_cells", force: :cascade do |t|
    t.string "h3", null: false
    t.string "opportunity_code"
    t.integer "units"
    t.integer "surface"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["h3"], name: "index_info_cells_on_h3"
    t.index ["opportunity_code"], name: "index_info_cells_on_opportunity_code"
  end

  create_table "municipalities", primary_key: "municipality_code", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "region_code", null: false
    t.integer "zoom"
    t.geometry "centroid", limit: {:srid=>4326, :type=>"geometry"}
    t.geometry "geometry", limit: {:srid=>4326, :type=>"geometry"}
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["centroid"], name: "index_municipalities_on_centroid", using: :gist
    t.index ["geometry"], name: "index_municipalities_on_geometry", using: :gist
    t.index ["region_code"], name: "index_municipalities_on_region_code"
  end

  create_table "opportunities", primary_key: "opportunity_code", id: :string, force: :cascade do |t|
    t.string "name"
    t.string "category"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["opportunity_code"], name: "index_opportunities_on_opportunity_code", unique: true
  end

  create_table "projects", force: :cascade do |t|
    t.string "name"
    t.bigint "scenario_id", null: false
    t.string "h3", null: false
    t.string "opportunity_code", null: false
    t.integer "total_agents"
    t.integer "surface_per_agent"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["h3"], name: "index_projects_on_h3"
    t.index ["opportunity_code"], name: "index_projects_on_opportunity_code"
    t.index ["scenario_id", "opportunity_code"], name: "idx_projects_scenario_opp"
    t.index ["scenario_id"], name: "index_projects_on_scenario_id"
  end

  create_table "regions", primary_key: "region_code", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "zoom"
    t.geometry "centroid", limit: {:srid=>4326, :type=>"geometry"}
    t.geometry "geometry", limit: {:srid=>4326, :type=>"geometry"}
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["centroid"], name: "index_regions_on_centroid", using: :gist
    t.index ["geometry"], name: "index_regions_on_geometry", using: :gist
  end

  create_table "scenario_cells", force: :cascade do |t|
    t.string "h3", null: false
    t.bigint "scenario_id", null: false
    t.string "opportunity_code", null: false
    t.integer "units_delta"
    t.integer "surface_delta"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.integer "units_total", null: false
    t.integer "surface_total", null: false
    t.index ["h3"], name: "index_scenario_cells_on_h3"
    t.index ["opportunity_code"], name: "index_scenario_cells_on_opportunity_code"
    t.index ["scenario_id", "h3", "opportunity_code"], name: "idx_scenario_cells_unique", unique: true
    t.index ["scenario_id", "opportunity_code"], name: "idx_scenario_cells_scenario_opp"
    t.index ["scenario_id"], name: "index_scenario_cells_on_scenario_id"
  end

  create_table "scenarios", force: :cascade do |t|
    t.string "name"
    t.bigint "user_id", null: false
    t.integer "municipality_code", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.string "status"
    t.bigint "parent_id"
    t.index ["municipality_code"], name: "index_scenarios_on_municipality_code"
    t.index ["user_id", "municipality_code", "status"], name: "index_scenarios_on_user_id_and_municipality_code_and_status"
    t.index ["user_id"], name: "index_scenarios_on_user_id"
  end

  create_table "travel_modes", force: :cascade do |t|
    t.integer "municipality_code", null: false
    t.string "mode"
    t.string "function"
    t.float "param_1"
    t.float "param_2"
    t.float "param_3"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["municipality_code"], name: "index_travel_modes_on_municipality_code"
  end

  create_table "travel_times", force: :cascade do |t|
    t.string "h3_origin", null: false
    t.string "h3_destiny", null: false
    t.float "travel_time"
    t.bigint "travel_mode_id", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["h3_destiny"], name: "index_travel_times_on_h3_destiny"
    t.index ["h3_origin"], name: "index_travel_times_on_h3_origin"
    t.index ["travel_mode_id", "h3_origin"], name: "idx_travel_times_mode_origin"
    t.index ["travel_mode_id"], name: "index_travel_times_on_travel_mode_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "accessibilities", "cells", column: "h3", primary_key: "h3"
  add_foreign_key "accessibilities", "opportunities", column: "opportunity_code", primary_key: "opportunity_code"
  add_foreign_key "accessibilities", "scenarios"
  add_foreign_key "accessibilities", "travel_modes"
  add_foreign_key "availabilities", "municipalities", column: "municipality_code", primary_key: "municipality_code"
  add_foreign_key "availabilities", "users"
  add_foreign_key "cells", "municipalities", column: "municipality_code", primary_key: "municipality_code"
  add_foreign_key "info_cells", "cells", column: "h3", primary_key: "h3"
  add_foreign_key "info_cells", "opportunities", column: "opportunity_code", primary_key: "opportunity_code"
  add_foreign_key "municipalities", "regions", column: "region_code", primary_key: "region_code"
  add_foreign_key "projects", "cells", column: "h3", primary_key: "h3"
  add_foreign_key "projects", "opportunities", column: "opportunity_code", primary_key: "opportunity_code"
  add_foreign_key "projects", "scenarios"
  add_foreign_key "scenario_cells", "cells", column: "h3", primary_key: "h3"
  add_foreign_key "scenario_cells", "opportunities", column: "opportunity_code", primary_key: "opportunity_code"
  add_foreign_key "scenario_cells", "scenarios"
  add_foreign_key "scenarios", "municipalities", column: "municipality_code", primary_key: "municipality_code"
  add_foreign_key "scenarios", "scenarios", column: "parent_id"
  add_foreign_key "scenarios", "users"
  add_foreign_key "travel_modes", "municipalities", column: "municipality_code", primary_key: "municipality_code"
  add_foreign_key "travel_times", "cells", column: "h3_destiny", primary_key: "h3"
  add_foreign_key "travel_times", "cells", column: "h3_origin", primary_key: "h3"
  add_foreign_key "travel_times", "travel_modes"
end
