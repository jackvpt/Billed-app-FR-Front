/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from "@testing-library/user-event"
import mockStore from "../__mocks__/store.js"

import router from "../app/Router.js"

/**
 * TEST IF THE WINDOW ICON IS HIGHLIGHTED
 */
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    it("Should highlight bill icon in vertical layout", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy() // ADD EXPECT TO CHECK IF THE ICON IS HIGHLIGHTED
    })

    it("Should sort bills from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

/**
 * TEST IF NAVIGATE TO NEW BILL PAGE
 */
describe("Given I am connected as an employee and I am on Bills page", () => {
  describe("When I click on 'nouvelle note de frais' button", () => {
    it("Should be sent on 'Envoyer une note de frais' page", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )

      document.body.innerHTML = BillsUI({ bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const store = null

      const billspage = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      })


      const handleClickNewBill = jest.fn(billspage.handleClickNewBill)

      const newBillButton = screen.getByTestId("btn-new-bill")
      newBillButton.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillButton)

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  /**
   * TEST IF THE MODAL OPENS WHEN CLICKING ON THE EYE ICON
   */
  describe("When I click on the icon eye", () => {
    beforeAll(() => {
      jQuery.fn.modal = jest.fn()
    })

    it("Should open a modal", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))

      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const billspage = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      })

      const iconEye = screen.getAllByTestId("icon-eye")
      expect(iconEye.length).toBeGreaterThan(0)

      const handleClickIconEye = jest.fn((icon) =>
        billspage.handleClickIconEye(icon)
      )

      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => handleClickIconEye(icon))
      })

      userEvent.click(iconEye[0])

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(handleClickIconEye).toHaveBeenCalledWith(iconEye[0])
      expect(handleClickIconEye).toHaveReturnedTimes(1)

      expect(jQuery.fn.modal).toHaveBeenCalledWith("show")
    })
  })
})

/**
 * TEST GET FUNCTION
 */
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    it("Should fetch bills from mock API", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const contentPending = screen.getByText("Transports")
      expect(contentPending).toBeTruthy()
      const contentRefused = screen.getByText("Services en ligne")
      expect(contentRefused).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        )
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
    })
  })


  
})
