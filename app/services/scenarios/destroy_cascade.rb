module Scenarios
  class DestroyCascade
    def self.call!(scenario:, user:)
      new(scenario:, user:).call!
    end

    def initialize(scenario:, user:)
      @scenario = scenario
      @user = user
    end

    def call!
      Scenario.transaction do
        ids = descendant_ids_for(@scenario.id, @user.id)

        # Seguridad extra: nunca borrar base (aunque estuviera en la cadena por bug)
        base_ids = Scenario.where(id: ids, status: "base").pluck(:id)
        if base_ids.any?
          raise ActiveRecord::Rollback, "Intento de borrar escenario base detectado."
        end

        # 1) borrar tablas dependientes
        Accessibility.where(scenario_id: ids).delete_all
        ScenarioCell.where(scenario_id: ids).delete_all
        Project.where(scenario_id: ids).delete_all

        # 2) borrar escenarios (hijos primero no es necesario si hacemos IN, pero ok)
        Scenario.where(id: ids, user_id: @user.id).delete_all
      end
    end

    private

    def descendant_ids_for(root_id, user_id)
      sql = <<~SQL
        WITH RECURSIVE tree AS (
          SELECT id, parent_id
          FROM scenarios
          WHERE id = $1 AND user_id = $2

          UNION ALL

          SELECT s.id, s.parent_id
          FROM scenarios s
          JOIN tree t ON s.parent_id = t.id
          WHERE s.user_id = $2
        )
        SELECT id FROM tree;
      SQL

      conn = ActiveRecord::Base.connection.raw_connection
      conn.exec_params(sql, [root_id, user_id]).map { |r| r["id"].to_i }
    end
  end
end
