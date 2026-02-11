Rails.application.routes.draw do
  devise_for :users
  # get 'home/index'
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "home#index"

  resources :regions, only: [:index] do
    collection do
      get :names
      get :focus
    end
  end

  resources :municipalities, only: [:index] do
    collection do
      get :names
      get :focus
    end
  end

  resources :cells, only: [] do
    collection do
      get :thematic
    end
  end


  resources :opportunities, only: [:index]
end
