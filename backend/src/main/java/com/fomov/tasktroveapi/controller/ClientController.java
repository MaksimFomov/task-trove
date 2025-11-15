package com.fomov.tasktroveapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Алиас контроллер для совместимости с фронтендом
 * Перенаправляет запросы с /api/client на /api/performers
 */
@RestController
@RequestMapping("/api/client")
public class ClientController {
    
    private final PerformerController performerController;
    
    public ClientController(PerformerController performerController) {
        this.performerController = performerController;
    }
    
    @GetMapping
    public Object listOrders(
            @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @RequestParam(value = "sortBy", required = false) String sortBy) {
        return performerController.listOrders(searchTerm, sortBy, 1, 50);
    }
    
    @GetMapping("/{id}")
    public Object getPerformer(@PathVariable Integer id) {
        return performerController.getPerformerById(id);
    }
    
    @GetMapping("/replies")
    public Object getAllReplies(@RequestParam(value = "tab", required = false) String tab) {
        return performerController.getAllReplies(tab);
    }
    
    @GetMapping("/chats")
    public Object getAllChats(@RequestParam(value = "tab", required = false) String tab) {
        return performerController.getAllChats(tab);
    }
    
    @GetMapping("/messages")
    public Object getAllMessage(@RequestParam("chatId") Integer chatId) {
        return performerController.getAllMessage(chatId);
    }
    
    @GetMapping("/info")
    public Object getInfo() {
        return performerController.getInfo();
    }
    
    @GetMapping("/portfolio")
    public Object getPortfolio() {
        return performerController.getPortfolio();
    }
}

