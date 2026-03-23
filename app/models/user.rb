class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  belongs_to :default_municipality, class_name: "Municipality",
             foreign_key: :municipality_code, primary_key: :municipality_code,
             optional: true
  has_many :scenarios
end
