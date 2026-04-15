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
      get :base_scenario
      get :access
    end
  end

  resources :cells, only: [] do
    collection do
      get :thematic
      get :accessibility
      get :delta
      get :accessibility_delta
      get :locator_status
      get :normative
    end
  end

  resources :scenarios, only: [:create, :destroy] do
    collection do
      get :names
    end
    member do
      post :recalculate
      get :projects_lists
    end
  end

  resources :projects, only: [:create, :destroy] do
    member do
      get :hover_info
    end
  end

  resources :opportunities, only: [:index]

  resources :simulation_agent_types, only: [:index]
  resources :simulation_requests, only: [:create] do
    member do
      get :status
    end
  end

  patch "users/default_municipality", to: "users#update_default_municipality"

  post "analytics/events", to: "analytics_events#create"
end
